/** @jsxImportSource @opentui/solid */
import { For } from "solid-js";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "../context/ThemeContext";

// 1. 直接在这里定义（或从你的 api 文件中导入）符合你 OpenAPI 结构的类型
interface ListedPostVo {
  metadata: {
    name: string;
    creationTimestamp?: string | null;
  };
  spec: {
    title: string;
    publishTime?: string;
  };
  owner?: {
    displayName?: string;
    name?: string;
  } | null;
}

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
          {(post) => {
            // 2. 提前计算好安全的安全属性，防止 OpenAPI 里的部分可选字段不存在导致报错
            const title = post.spec?.title ?? "无标题";
            const author =
              post.owner?.displayName || post.owner?.name || "匿名";
            const publishTime = post.spec?.publishTime;

            return (
              <box
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: 0,
                  margin: 0,
                  paddingRight: 3,
                  border: ["top","left","right"],
                  
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
