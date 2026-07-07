/** @jsxImportSource @opentui/solid */
import { createResource, createEffect, Show } from "solid-js";
import { useTheme } from "../context/ThemeContext";
import { PostList } from "./PostList";
import { getAdapter } from "../api/adapters";
import { GifPlayer } from "./GifPlayer";
// @ts-ignore
import gifSrc from "../assets/doro.gif" with { type: "image/gif" };
// @ts-ignore
import gifSr2 from "../assets/9f2ffeefda81a1841f40adb3f225958e.gif" with { type: "image/gif" };
import type { ListedPostVo } from "../api/types";
import PostDetail from "./PostDetail";
import { useChat } from "../context/ChatContext";
import { usePostContext } from "../context/PostContext";
import { postToMarkdown } from "../lib/postToMarkdown";
import { useSession } from "../context/SessionContext";
import { useI18n } from "../i18n";
import { TextAttributes } from "@opentui/core";

export function MainContent() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const chat = useChat();
  const { currentSource, showPost, setShowPost } = usePostContext();
  const session = useSession();

  const [posts] = createResource(
    () => currentSource(),
    async (sourceId) => {
      const adapter = getAdapter(sourceId);
      return adapter.queryPosts({ page: 1, size: undefined });
    }
  );

  // 当 showPost 变化时，更新 AI 上下文
  createEffect(() => {
    const post = showPost();
    const sourceId = currentSource();
    if (post) {
      postToMarkdown(post, sourceId).then((md) => {
        // 切源或关文后，忽略过期的结果
        if (currentSource() !== sourceId || showPost()?.metadata.name !== post.metadata.name) return;
        const title = post.spec?.title ?? t("post.untitled");
        chat.setContext(
          `post:${post.metadata.name}`,
          `${t("ai.ctx.reading", { title })}\n\n${md}`,
        );
      });
    } else {
      // 回到首页 → 把文章列表作为上下文
      const items = posts()?.items;
      if (items && items.length > 0) {
        const list = items
          .map(
            (p, i) =>
              `${i + 1}. ${p.spec?.title ?? t("post.untitled")} (${p.metadata.name})`,
          )
          .join("\n");
        chat.setContext("home", `${t("ai.ctx.home")}\n\n${list}`);
      }
    }
  });

  const handlePostClick = (post: ListedPostVo) => {
    setShowPost(post);
  };

  const handleClosePost = () => {
    setShowPost(null);
  };

  return (
    <box
      style={{
        height: "100%",
        width: "100%",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        flexGrow: 3,
        gap: 0,
        // backgroundColor: "#ffffff",
      }}
    >
      {/* ── 列表头 ── */}
      <box
        style={{
          width: "100%",

          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 1,
          paddingX: 3,
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
          {showPost() == null ? t("nav.disconnect") : t("nav.backToList")}
        </text>
        <Show when={showPost() == null}>
          <text style={{ fg: theme.accent, attributes: TextAttributes.BOLD }}>
            {t("posts.title")}
          </text>
        </Show>
        <Show when={showPost() == null}>
          <text style={{ fg: theme.textMuted }}>
            {t("posts.count", { count: posts()?.total ?? 0 })}
          </text>
        </Show>
        <Show when={showPost() != null}>
          <text>
            {(showPost()?.spec?.title ?? t("post.untitled")).slice(0, 20)}
            {(showPost()?.spec?.title ?? "").length > 20 ? "…" : ""}
          </text>
        </Show>

        <text>{t("shortcut.theme")}</text>
      </box>
      <Show when={showPost() != null}>
        <PostDetail
          handleClose={handleClosePost}
          post={showPost() as ListedPostVo}
          sourceId={currentSource()}
        />
      </Show>
      <Show when={showPost() == null}>
        {/* 3. 优先处理错误状态 */}
        <Show
          when={!posts.error}
          fallback={
            <text style={{ fg: theme.error || "#ff5555" }}>
              {" "}
              {t("posts.loadError", {
                message: posts.error?.message || t("error.unknownNetwork"),
              })}
            </text>
          }
        >
          {/* 4. 处理正常加载与数据渲染 */}
          <Show
            when={!posts.loading && posts()}
            fallback={
              <text style={{ fg: theme.textMuted }}>
                {" "}
                {t("posts.loading")}
              </text>
            }
          >
            {(data) => (
              <PostList
                posts={data().items ?? []}
                enterPost={handlePostClick}
              />
            )}
          </Show>
        </Show>
      </Show>
    </box>
  );
}
