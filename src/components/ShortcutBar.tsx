/** @jsxImportSource @opentui/solid */
import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/ThemeContext"
import { useI18n } from "../i18n"

export function ShortcutBar() {
  const { theme } = useTheme()
  const { t } = useI18n()

  return (
    <box
      style={{
        height: 2,
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        paddingLeft: 1,
        paddingRight: 1,
        gap: 2,
      }}
    >
      <text style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>Ctrl+T</text>
      <text style={{ fg: theme.textMuted }}>{` ${t("shortcut.themeWord")}`}</text>
      <text style={{ fg: theme.border }}>│</text>
      <text style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>Q</text>
      <text style={{ fg: theme.textMuted }}>/</text>
      <text style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>Ctrl+C</text>
      <text style={{ fg: theme.textMuted }}>{t("shortcut.quit")}</text>
    </box>
  )
}
