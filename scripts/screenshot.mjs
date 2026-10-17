#!/usr/bin/env node
/**
 * 用系统自带的 Edge/Chrome 截「手机尺寸」的网页截图，供交付前自查。
 * 零依赖：直接走浏览器调试协议（CDP），用 Emulation 固定 390×844 / DPR 2，
 * 所以截图里的布局和手机一致，不受桌面窗口缩放影响。
 *
 *   node scripts/screenshot.mjs                  # 截 / /plan /me
 *   node scripts/screenshot.mjs /plan            # 只截指定路由
 *   PORT=8082 node scripts/screenshot.mjs        # 指定 Metro 端口
 *   WIDTH=430 HEIGHT=932 node scripts/screenshot.mjs
 *   SEED_PLAN='{"income":...}' node scripts/screenshot.mjs
 *     预置 ml_plan_v2 到 localStorage（只在无头浏览器的临时 profile 里），用来看有数据的样子
 *
 * 产物在 .shots/（已 gitignore）。前提：Metro 已在跑（npm start 或 预览.bat）。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const PORT = process.env.PORT ?? '8081';
// 用 127.0.0.1 而不是 localhost：Node 的 fetch 有时先试 ::1，而 Metro 只监听 IPv4
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTH = Number(process.env.WIDTH ?? 390);
const HEIGHT = Number(process.env.HEIGHT ?? 844);
const OUT_DIR = path.resolve('.shots');
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/plan', '/me'];
// 只影响这个临时浏览器 profile；App 的 AsyncStorage 在 Web 上就是普通 localStorage
const SEED_PLAN = process.env.SEED_PLAN ?? null;
// SEED_PREFS='{"theme":"dark","convertView":"grid"}' 预置「我的」里的设置
const SEED_PREFS = process.env.SEED_PREFS ?? null;
// CLICK_TEXT=清空收支数据 在截图前点一下这段文字（验主题切换 / 二次确认用）
const CLICK_TEXT = process.env.CLICK_TEXT ?? null;
// DUMP_STORAGE=1 点击之后打印 localStorage 里的两个 key（验清空有没有真的写掉）
const DUMP_STORAGE = process.env.DUMP_STORAGE === '1';
// TYPE_AMOUNT=599 会在 TYPE_ROUTE（默认 /）上往第一个输入框里打字，用来看「输入了金额」的结果页
const TYPE_AMOUNT = process.env.TYPE_AMOUNT ?? null;
const TYPE_ROUTE = process.env.TYPE_ROUTE ?? '/';

const CANDIDATES = [
  process.env.BROWSER_PATH,
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  console.error('找不到 Edge / Chrome。设 BROWSER_PATH 环境变量指向浏览器可执行文件。');
  process.exit(1);
}

// 只探 TCP 端口：Metro 在忙的时候 HTTP 响应会很慢，但端口开着就说明服务器在
const portOpen = await new Promise((resolve) => {
  const socket = net.connect({ port: Number(PORT), host: '127.0.0.1' }, () => {
    socket.destroy();
    resolve(true);
  });
  socket.setTimeout(3000, () => {
    socket.destroy();
    resolve(false);
  });
  socket.on('error', () => resolve(false));
});
if (!portOpen) {
  console.error(`Metro 没在 ${BASE} 上跑。先执行 npm start 或双击 预览.bat。`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeoutMs = 20000) {
  const start = Date.now();
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      /* keep polling */
    }
    if (Date.now() - start > timeoutMs) throw new Error('等待浏览器调试端口超时');
    await sleep(200);
  }
}

const dbgPort = 9333 + Math.floor(Math.random() * 500);
const profile = path.join(os.tmpdir(), `ml-shots-${dbgPort}`);
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

const child = spawn(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true }
);

const exited = new Promise((resolve) => child.once('exit', resolve));
async function cleanup() {
  try {
    child.kill();
  } catch {
    /* already gone */
  }
  await Promise.race([exited, sleep(4000)]);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* 浏览器可能还在写盘，下次启动会覆盖 */
  }
}
process.on('exit', () => {
  try {
    child.kill();
  } catch {
    /* already gone */
  }
});

let ws;
try {
  const target = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json();
    return list.find((t) => t.type === 'page');
  });

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    if (ws.readyState === 1) resolve();
    else {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    }
  });

  let seq = 0;
  const pending = new Map();
  let onLoad = null;
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Page.loadEventFired' && onLoad) {
      onLoad();
      onLoad = null;
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (msg) => (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 2,
    mobile: true,
  });
  // THEME=dark|light 固定配色；不设则跟随系统
  if (process.env.THEME) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: process.env.THEME }],
    });
  }

  // 在每个新文档的 App 脚本执行之前，先把收支塞进 localStorage：
  // 这样截出来的是「填过收支」的界面，而不是首开空态。
  if (SEED_PLAN) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.localStorage.setItem('ml_plan_v2', ${JSON.stringify(SEED_PLAN)})`,
    });
    console.log('已预置 ml_plan_v2');
  }

  if (SEED_PREFS) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.localStorage.setItem('ml_settings_v1', ${JSON.stringify(SEED_PREFS)})`,
    });
    console.log('已预置 ml_settings_v1');
  }

  mkdirSync(OUT_DIR, { recursive: true });
  let failed = 0;
  for (const route of ROUTES) {
    const name = route === '/' ? 'index' : route.replaceAll('/', '_').replace(/^_/, '');
    const file = path.join(OUT_DIR, `${name}.png`);
    try {
      const loaded = new Promise((resolve) => {
        onLoad = resolve;
      });
      await send('Page.navigate', { url: `${BASE}${route}` });
      await Promise.race([loaded, sleep(15000)]);
      // 图标字体（MaterialCommunityIcons）加载得比页面慢，等不够截出来就是方块
      await sleep(Number(process.env.WAIT ?? 5000));
      if (TYPE_AMOUNT && route === TYPE_ROUTE) {
        // 直接往 React 受控 input 里写值：先走原生 value setter，再派发 input 事件，
        // 这样 React 的 onChange 才会收到（Input.insertText 在无头模式下不一定进得去）
        await send('Runtime.evaluate', {
          expression: `(() => {
            const el = document.querySelector('input');
            if (!el) return false;
            el.focus();
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, ${JSON.stringify(TYPE_AMOUNT)});
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          })()`,
        });
        await sleep(800);
      }
      if (CLICK_TEXT) {
        // 支持 '清空收支数据>清空' 这样的连点：按文字找最内层节点，把 pointer / mouse
        // 一串事件都派发一遍：RNW 的 Pressable 认的是 pointer 事件，光 click() 不一定触发
        for (const target of CLICK_TEXT.split('>')) {
          const clicked = await send('Runtime.evaluate', {
            expression: `(() => {
              const target = ${JSON.stringify(target)};
              const el = Array.from(document.querySelectorAll('div, span')).find(
                (node) => node.childElementCount === 0 && node.textContent === target,
              );
              if (!el) return 'not-found';
              const opts = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0 };
              el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, buttons: 1 }));
              el.dispatchEvent(new MouseEvent('mousedown', { ...opts, buttons: 1 }));
              el.dispatchEvent(new PointerEvent('pointerup', opts));
              el.dispatchEvent(new MouseEvent('mouseup', opts));
              el.dispatchEvent(new MouseEvent('click', opts));
              return 'clicked';
            })()`,
            returnByValue: true,
          });
          console.log(`点击「${target}」：${clicked.result.value}`);
          await sleep(800);
        }

        if (DUMP_STORAGE) {
          const storage = await send('Runtime.evaluate', {
            expression: `JSON.stringify({
              plan: window.localStorage.getItem('ml_plan_v2'),
              prefs: window.localStorage.getItem('ml_settings_v1'),
            })`,
            returnByValue: true,
          });
          console.log(`localStorage：${storage.result.value}`);
        }
      }
      // 图标字体是异步加载的，不等它截出来就是空白方块
      await send('Runtime.evaluate', {
        expression: 'document.fonts.ready.then(() => true)',
        awaitPromise: true,
      });
      await sleep(600);
      const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`${route.padEnd(8)} -> ${path.relative(process.cwd(), file)}`);
    } catch (err) {
      failed += 1;
      console.error(`${route.padEnd(8)} FAILED: ${err.message}`);
    }
  }
  process.exitCode = failed ? 1 : 0;
} finally {
  ws?.close();
  await cleanup();
}
