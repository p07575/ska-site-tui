/** @jsxImportSource @opentui/solid */
import { Show } from "solid-js";
import { useTheme } from "../context/ThemeContext";
import { usePostContext } from "../context/PostContext";
import { AIChat } from "./AIChat";
import { formatDate } from "../lib/date";
import { useSession } from "../context/SessionContext";
export function Sidebar({ width }: { width: number | `${number}%` }) {
  const { theme } = useTheme();
  const { showPost, setShowPost } = usePostContext();
  const session = useSession();
  return (
    <box
      style={{
        flexGrow: 1,
        flexShrink: 0,
        width: width,
        flexDirection: "column",
        backgroundColor: theme.background,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
      }}
    >
      <box
        style={{
          marginBottom: 0,
          paddingBottom: 0,
          // backgroundColor: "#b91007",
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: 2,
          width: "100%",
          // border: ["bottom"],
          flexShrink: 0,
        }}
      >
        <text
          onMouseDown={() => {
            if (showPost() == null) {
              session.endSession();
              return;
            }
            setShowPost(null);
          }}
        >
          {showPost() == null ? "[断开连接]" : "[返回首页]"}
        </text>
        <text bg="#ffb86c" fg="#000000">
          {"1"}
        </text>
        <text>{"2"}</text>
        <text>{"3"}</text>
      </box>
      <box
        style={{
          border: true,
        }}
        title=" STATUS "
        titleColor="#5cb66b"
        flexShrink={0}
        paddingX={1}
      >
        <Show when={showPost() != null}>
          <text>当前文章：{showPost()?.spec?.title || "无名"}</text>
          <text>
            更新时间：
            {formatDate(showPost()?.spec?.publishTime)}
          </text>
        </Show>
        <Show when={showPost() == null}>
          <text>当前位置：首页</text>
          <text>当前用户：{session.username}</text>
        </Show>
      </box>
      <box
        style={{
          border: true,
        }}
        title=" AI Chat "
        titleColor="#58A6FF"
        flexShrink={1}
      >
        <AIChat />
      </box>
    </box>
  );
}
