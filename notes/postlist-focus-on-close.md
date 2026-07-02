# PostList 关闭文章详情后自动聚焦

## 需求

关闭文章详情（`showPost` 从 `非null → null`）后，回到文章列表时自动聚焦到当前选中的卡片。

## 项目结构关键点

`MainContent.tsx` 中，`PostList` 和 `PostDetail` 通过 `<Show>` **互斥渲染**：

```tsx
<Show when={showPost() != null}>
  <PostDetail ... />
</Show>
<Show when={showPost() == null}>
  <PostList ... />
</Show>
```

**这意味着 `PostList` 在打开文章时被卸载，关闭文章时被重新挂载（全新组件实例）。**

---

## ❌ 踩坑方案

### 方案 1：`let` 变量 + `createEffect` 手动追踪前值

```tsx
let prevShowPost: any = postcontext.showPost();
createEffect(() => {
  const current = postcontext.showPost();
  if (prevShowPost !== null && current === null) {
    focusCard(focusedIndex());
  }
  prevShowPost = current;
});
```

**问题**：`prevShowPost` 始终是 `null`。因为 `PostList` 是被 `<Show>` 条件渲染的，每次关闭文章回来都是全新挂载，`let` 变量初始值永远是 `null`。

### 方案 2：SolidJS `on()` 辅助函数

```tsx
createEffect(
  on(
    () => postcontext.showPost(),
    (current, prev) => {
      if (prev != null && current == null) {
        focusCard(focusedIndex());
      }
    },
  ),
);
```

**问题**：SolidJS `on()` 的第二个参数 `prev` 是**回调函数上一次返回值**，不是 signal 的前值。由于回调返回 `void`，`prev` 始终是 `undefined`。

### 方案 3：在 `PostList` 内监听 `showPost` 变化

引入 `usePostContext`，试图在 `PostList` 组件内部检测 `showPost` 变化。

**问题**：同方案 1，`PostList` 被卸载后重新挂载，无法感知之前的状态。且移除导入后残留了 `const postcontext = usePostContext()` 导致 `ReferenceError`。

---

## ✅ 最终方案：利用 PostList 挂载时机

**核心思路**：既然 `PostList` 每次挂载就意味着"从文章详情返回"，那就不需要追踪 `showPost` 的变化，只需要在挂载时正确聚焦即可。

```tsx
onMount(() => {
  renderer.keyInput.on("keypress", handleKey);
  // PostList 每次挂载都是从文章详情返回，延迟一帧确保卡片 refs 已挂载
  if (props.posts.length > 0) {
    setTimeout(() => focusCard(focusedIndex()), 0);
  }
});
```

**为什么需要 `setTimeout`**：`onMount` 触发时，子组件的 `ref` 可能还未全部赋值到 `cardRefs` Map 中。`setTimeout(fn, 0)` 将聚焦推到下一个微任务，确保所有卡片的 `ref` 回调已执行完毕。

---

## 关键结论

| 场景 | 正确做法 |
|------|---------|
| 组件始终存活（不被卸载） | 用 `let` 变量或 `on()` 在 effect 中追踪前值 |
| 组件被 `<Show>` / `<Suspense>` 条件渲染导致卸载重建 | 利用 `onMount` 处理"首次出现"的逻辑 |

**SolidJS 的 `on()` 的 `prev` 参数是回调返回值的前值，不是 signal 的前值。** 如需追踪 signal 前值，应使用 `let` 变量或 `createMemo` 手动实现。
