/** @jsxImportSource @opentui/solid */
import { createResource, Show } from "solid-js";
import { useTheme } from "../context/ThemeContext";
import { PostList } from "./PostList";
import { queryPosts } from "../api/client"; // 1. 确保导入你刚刚写的 ky 请求方法

export function MainContent() {
  const { theme } = useTheme();

  // 2. 创建 Solid 数据资源，默认查询第 1 页，加载 20 条（可根据你的 TUI 容器高度调整）
  const [posts] = createResource(async () => {
    return await queryPosts({ page: 1, size: 20 });
  });

  return (
    <scrollbox
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: "auto",
        minWidth: 20,
        height: "auto",
        backgroundColor: theme.background,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 1,
        scrollY: true,
      }}
    >
      {/* 3. 优先处理错误状态 */}
      <Show when={!posts.error} fallback={
        <text style={{ fg: theme.error || "#ff5555" }}>
          {" "}❌ 加载失败: {posts.error()?.message || "未知网络错误"}
        </text>
      }>
        {/* 4. 处理正常加载与数据渲染 */}
        <Show 
          when={!posts.loading && posts()} 
          fallback={
            <text style={{ fg: theme.textMuted }}>
              {" "}⏳ 正在从 Halo 读取文章列表中...
            </text>
          }
        >
          {/* 这里用形参 data 拿到的就是 posts() 的安全解包值 */}
          {(data) => (
            <PostList posts={data().items ?? []} total={data().total ?? 0} />
          )}
        </Show>
      </Show>
    </scrollbox>
  );
}