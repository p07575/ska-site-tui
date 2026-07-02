# 自定义 ScrollBox 滚动速度

## 背景

OpenTUI 的 `<scrollbox>` 默认鼠标滚轮每帧滚动 `baseDelta × 1` 行（`LinearScrollAccel`），速度较慢。

## 原理

滚动量计算公式（`ScrollBox.ts` 行 535-539）：

```ts
const scrollAmount = baseDelta * multiplier
```

| 因素 | 来源 | 可配置 |
|---|---|---|
| `baseDelta` | 终端鼠标事件 | ❌ |
| `multiplier` | `scrollAcceleration.tick()` | ✅ |

## 内置实现

- **`LinearScrollAccel`** — 恒定返回 `1`（默认）
- **`MacOSScrollAccel`** — 指数加速，可配置 `A`、`tau`、`maxMultiplier`（默认最大 6 倍）

## 自定义方案

在 `src/lib/scroll-accel.ts` 中实现 `ScrollAcceleration` 接口：

```ts
import type { ScrollAcceleration } from "@opentui/core";

export class FixedScrollAccel implements ScrollAcceleration {
  constructor(private multiplier: number = 3) {}
  tick(_now?: number): number { return this.multiplier; }
  reset(): void {}
}

export const fastScroll = new FixedScrollAccel(3); // 3 倍速
```

## 使用方式

在 `<scrollbox>` 上作为 JSX prop 传入：

```tsx
import { fastScroll } from "../lib/scroll-accel";

<scrollbox scrollAcceleration={fastScroll}>
  {/* ... */}
</scrollbox>
```

OpenTUI Solid 绑定通过 `setProperty` → `node["scrollAcceleration"] = value` 调用 renderable 的 setter 生效。

## 注意事项

- `scrollAcceleration` 不会传入构造函数，而是在 `createElement` 之后通过 setter 设置，首帧可能使用默认值（实际无感知）
- 修改倍率只需调整 `FixedScrollAccel(N)` 中的数字
- 也可用 `ref` 回调设置：`ref.scrollAcceleration = new FixedScrollAccel(5)`
