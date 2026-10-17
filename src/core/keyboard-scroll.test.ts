import { describe, expect, it } from 'vitest';

import { revealScrollOffset } from './keyboard-scroll';

const base = {
  viewport: 400,
  contentHeight: 2000,
  margin: 16,
};

describe('revealScrollOffset', () => {
  it('这一行本来就看得见时不动，别把页面翻走', () => {
    expect(
      revealScrollOffset({ ...base, top: 100, bottom: 148, anchor: 0, current: 0 }),
    ).toBeNull();
    expect(
      revealScrollOffset({ ...base, top: 950, bottom: 998, anchor: 900, current: 900 }),
    ).toBeNull();
  });

  it('被键盘压住时只补「压住的那点距离」，不是把整页弹回顶部', () => {
    // 可视区 0~400，这一行 380~428：底边超出可视区底边 28
    expect(revealScrollOffset({ ...base, top: 380, bottom: 428, anchor: 0, current: 0 })).toBe(44);
  });

  it('滚动位置被系统清零后，能回到用户原来停的位置', () => {
    // 用户停在 900，系统把 offset 清成 0：回到 900，而不是留在顶部
    expect(revealScrollOffset({ ...base, top: 950, bottom: 998, anchor: 900, current: 0 })).toBe(
      900,
    );
  });

  it('这一行跑到了可视区上方时，把它顶边放到 margin 处', () => {
    expect(revealScrollOffset({ ...base, top: 500, bottom: 548, anchor: 900, current: 900 })).toBe(
      484,
    );
  });

  it('滚动位置不出内容范围', () => {
    // 内容只有 300 高、可视区 400：压根没法滚
    expect(
      revealScrollOffset({
        ...base,
        contentHeight: 300,
        top: 100,
        bottom: 148,
        anchor: 0,
        current: 0,
      }),
    ).toBeNull();
    // 已经在最底部，再往下也没得滚
    expect(
      revealScrollOffset({
        ...base,
        contentHeight: 1800,
        top: 1900,
        bottom: 1950,
        anchor: 1400,
        current: 1400,
      }),
    ).toBeNull();
  });

  it('数据还没量出来时不动', () => {
    expect(
      revealScrollOffset({ ...base, viewport: 0, top: 100, bottom: 148, anchor: 0, current: 0 }),
    ).toBeNull();
    expect(
      revealScrollOffset({ ...base, top: 100, bottom: 100, anchor: 0, current: 0 }),
    ).toBeNull();
  });
});
