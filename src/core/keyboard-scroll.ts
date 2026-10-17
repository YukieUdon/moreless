/**
 * 弹键盘时「把正在编辑的那一行挪到键盘上方」要滚到哪里。
 *
 * 纯计算，不碰 react / expo：安卓弹键盘会把窗口压短，页面得自己补一段滚动，
 * 这段距离算错了就会把整页弹回顶部（2026-10-18 修过一次），所以单独测。
 */

/** 内容坐标系里的位置，单位和滚动位置是同一套 */
export type RevealBox = {
  /** 这一行在内容里的上边 */
  top: number;
  /** 这一行在内容里的下边 */
  bottom: number;
  /** 用户点下去那一刻停在的滚动位置：以它为准，别被系统清零带走 */
  anchor: number;
  /** 现在的滚动位置 */
  current: number;
  /** 可视区（ScrollView）的高度 */
  viewport: number;
  /** 内容总高 */
  contentHeight: number;
  /** 上下至少留多少余量 */
  margin: number;
};

/** 小于这个距离就不动，省得为了一两像素抖一下 */
const MIN_DELTA = 2;

/**
 * 返回新的滚动位置；不用动（已经看得见 / 数据还不全）返回 null。
 * 以 anchor 为准，只补「这一行被挡住」的那点距离，不会为了它把页面翻到别处。
 */
export function revealScrollOffset({
  top,
  bottom,
  anchor,
  current,
  viewport,
  contentHeight,
  margin,
}: RevealBox): number | null {
  if (viewport <= 0 || bottom <= top) return null;

  const maxOffset = Math.max(0, contentHeight - viewport);
  const keep = Math.min(Math.max(anchor, 0), maxOffset);

  let target = keep;
  if (bottom > keep + viewport - margin) {
    // 底边被键盘压住了：把它抬到「可视区底边往上 margin」处
    target = bottom - viewport + margin;
  } else if (top < keep + margin) {
    // 反过来，这一行跑到了可视区上方：把它顶边放到 margin 处
    target = top - margin;
  }

  target = Math.min(Math.max(target, 0), maxOffset);
  return Math.abs(target - current) < MIN_DELTA ? null : target;
}
