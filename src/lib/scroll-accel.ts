import type { ScrollAcceleration } from "@opentui/core";

/**
 * 固定倍率滚动加速器，使鼠标滚轮每次滚动 N 行。
 * 默认 3 倍速（终端默认 1 倍）。
 */
export class FixedScrollAccel implements ScrollAcceleration {
  constructor(private multiplier: number = 3) {}

  tick(_now?: number): number {
    return this.multiplier;
  }

  reset(): void {}
}

/** 预置实例：3 倍速滚动 */
export const fastScroll = new FixedScrollAccel(5);
