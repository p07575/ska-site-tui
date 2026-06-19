/** @jsxImportSource @opentui/solid */
import { For, createSignal } from "solid-js";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "../context/ThemeContext";
import type { ListedPostVo } from "../api/types";

interface PostListProps {
  posts: ListedPostVo[]; // 适配 OpenAPI 返回的项
  total: number;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "未知日期";
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}

export function PostList(props: PostListProps) {
  const { theme } = useTheme();

  return (
    <box
      style={{
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: 0,
        margin: 0,
      }}
    >
      {/* 标题栏 */}
      <text
        style={{
          fg: theme.accent,
          attributes: TextAttributes.BOLD,
        }}
      >
        {" "}
        📋 文章列表 (共 {props.total} 篇)
      </text>
      <text style={{ fg: theme.textMuted }}>{"─".repeat(50)}</text>

      {/* 文章条目 */}
      <box
        style={{
          flexDirection: "column",
        }}
      >
        <For each={props.posts}>
          {(post, index) => {
            const title = post.spec?.title ?? "无标题";
            const author =
              post.owner?.displayName || post.owner?.name || "匿名";
            const publishTime = post.spec?.publishTime;
            const isFirst = () => index() === 0;
            const isLast = () => index() === props.posts.length - 1;
            const [isHover, setIsHover] = createSignal(false);
            return (
              <box
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: 0,
                  margin: 0,
                  paddingRight: 3,
                  border: isLast()
                    ? ["top", "left", "right", "bottom"]
                    : ["top", "left", "right"],
                  customBorderChars: {
                    topLeft: isFirst() ? "┌" : "├",
                    topRight: isFirst() ? "┐" : "┤",
                    bottomLeft: isLast() ? "└" : "├",
                    bottomRight: isLast() ? "┘" : "┤",
                    horizontal: "─",
                    vertical: "│",
                    leftT: "│",
                    rightT: "│",
                    topT: "─",
                    bottomT: "─",
                    cross: "─",
                  },
                  backgroundColor: isHover()
                    ? theme.backgroundElement
                    : theme.background,
                }}
                onMouse={(e) => {
                  switch (e.type) {
                    case "over":
                      setIsHover(true);
                      break;
                    case "out":
                      setIsHover(false);
                      break;
                  }
                }}
              >
                {/* <text style={{ fg: theme.accent }}> 📄 </text> */}
                <box>
                  <text
                    style={{
                      fg: theme.text,
                      attributes: TextAttributes.BOLD,
                    }}
                  >
                    {" "}
                    {/* {index()} */}
                    {title}
                  </text>
                </box>
                <box
                  style={{
                    flexDirection: "row",
                  }}
                >
                  <text style={{ fg: theme.textMuted }}> {author} </text>
                  <text style={{ fg: theme.textMuted, flexShrink: 1 }}>
                    {" "}
                    {formatDate(publishTime)}
                  </text>
                </box>
              </box>
            );
          }}
        </For>
      </box>

      {props.posts.length === 0 && (
        <text style={{ fg: theme.textMuted }}>{"  暂无文章"}</text>
      )}
    </box>
  );
}
