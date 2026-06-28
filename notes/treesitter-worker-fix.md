# 修复 TreeSitter Worker 路径解析问题

**日期：** 2026-06-29

## 问题

构建后运行 `bun dist/index.js` 报错：

```
TreeSitter worker error: BuildMessage: ModuleNotFound resolving "...\dist\parser.worker.ts" (entry point)
```

## 根本原因

`build.ts` 中 `external` 配置为 `["@opentui/core-*"]`，这个 glob 模式只匹配子包（如 `@opentui/core-worker`），**不匹配** `@opentui/core` 本身。

因此 `@opentui/core` 被打包进了 `dist/index.js`，导致包内 `import.meta.url` 从原来的 `node_modules/@opentui/core/` 变成了 `dist/`。TreeSitter Worker 的路径解析依赖 `import.meta.url` 来定位 `parser.worker.js`，打包后就找不到了。

## 解决方案

修改 `build.ts`，将 `@opentui/core` 也加入 external：

```typescript
external: ["@opentui/core", "@opentui/core-*"],
```

## 原理

OpenTUI 的 TreeSitter 使用 Worker 线程做语法高亮解析。`@opentui/core` 内部通过 `new URL("./parser.worker.js", import.meta.url)` 定位 Worker 脚本。当包被外部化（external）时，`import.meta.url` 保持指向 `node_modules` 目录，路径正确；当包被打包内联时，`import.meta.url` 指向输出目录，路径错误。
