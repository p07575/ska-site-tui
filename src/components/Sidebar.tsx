/** @jsxImportSource @opentui/solid */
import { Show } from "solid-js";
import { useTheme } from "../context/ThemeContext";
import { usePostContext } from "../context/PostContext";
import { AIChat } from "./AIChat";
import { formatDate } from "../lib/date";
import { useSession } from "../context/SessionContext";
import { useFocusGroup } from "../context/FocusContext";
import { getBlogSourceList } from "../api/adapters";
import { useI18n } from "../i18n";
export function Sidebar({ width }: { width: number | `${number}%` }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { currentSource, setCurrentSource, showPost, setShowPost } = usePostContext();
  const session = useSession();
  const blogSources = getBlogSourceList();
  const { isActive } = useFocusGroup("sidebar");
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
          border: true,
        }}
        title=" STATUS "
        titleColor="#5cb66b"
        flexShrink={0}
        paddingX={1}
      >
        <Show when={showPost() != null}>
          <text>
            {t("sidebar.currentPost", {
              title: showPost()?.spec?.title || t("post.untitled"),
            })}
          </text>
          <text>
            {t("sidebar.updatedAt")}
            {formatDate(showPost()?.spec?.publishTime)}
          </text>
        </Show>
        <Show when={showPost() == null}>
          <text>{t("sidebar.locationHome")}</text>
          <text>{t("sidebar.currentUser", { user: session.username })}</text>
        </Show>
      </box>
      <box
        style={{
          border: true,
        }}
        title={t("sidebar.links")}
        titleColor="#5cb66b"
        flexShrink={0}
        paddingX={1}
      >
        {blogSources.map((source) => {
          const label = () =>
            source.id === "master" ? t("source.master") : source.name;
          return (
            <text
              style={{
                alignSelf: "center",
                fg: currentSource() === source.id ? "#5cb66b" : theme.text,
              }}
              onMouseDown={() => {
                setShowPost(null);
                setTimeout(() => setCurrentSource(source.id), 0);
              }}
            >
              {currentSource() === source.id ? `▸ ${label()}` : label()}
            </text>
          );
        })}
      </box>
      <box
        style={{
          border: true,
          borderColor: isActive() ? "#58A6FF" : theme.text,
        }}
        title=" AI Chat "
        titleColor={isActive() ? "#58A6FF" : "#58A6FF"}
        flexShrink={1}
      >
        <AIChat />
      </box>
    </box>
  );
}
