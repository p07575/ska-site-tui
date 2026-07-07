/** @jsxImportSource @opentui/solid */
import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/ThemeContext"
import { useSession } from "../context/SessionContext"
import { useI18n } from "../i18n"
import { useDialog, type DialogContext } from "./dialog"

export function UserInfoDialog() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const { t } = useI18n()
  const session = useSession()

  const methodLabel = (m: string): string =>
    (
      {
        none: t("auth.none"),
        password: t("auth.password"),
        "keyboard-interactive": t("auth.keyboardInteractive"),
        publickey: t("auth.publickey"),
      } as Record<string, string>
    )[m] ?? m

  return (
    <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      {/* Title */}
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {t("userinfo.title")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>

      <box flexDirection="column" gap={0}>
        {/* Username */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.username")}
          </text>
          <text fg={theme.text}>{session.username}</text>
        </box>

        {/* Auth method */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.authMethod")}
          </text>
          <text fg={theme.text}>{methodLabel(session.method)}</text>
        </box>

        {/* Fingerprint (publickey only) */}
        {session.fingerprint && (
          <box flexDirection="row" gap={1}>
            <text fg={theme.accent} attributes={TextAttributes.BOLD}>
              {t("userinfo.fingerprint")}
            </text>
            <text fg={theme.text}>{session.fingerprint}</text>
          </box>
        )}

        {/* Public key algorithm (publickey only) */}
        {session.publicKey && (
          <box flexDirection="row" gap={1}>
            <text fg={theme.accent} attributes={TextAttributes.BOLD}>
              {t("userinfo.keyAlgorithm")}
            </text>
            <text fg={theme.text}>{session.publicKey.algorithm}</text>
          </box>
        )}

        {/* Remote address */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.remoteAddress")}
          </text>
          <text fg={theme.text}>
            {session.remoteAddress.address}
            {session.remoteAddress.port != null ? `:${session.remoteAddress.port}` : ""}
          </text>
        </box>

        {/* Terminal type */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.terminalType")}
          </text>
          <text fg={theme.text}>{session.term || t("common.unknown")}</text>
        </box>

        {/* Terminal size */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.terminalSize")}
          </text>
          <text fg={theme.text}>
            {session.cols} × {session.rows}
          </text>
        </box>

        {/* PTY */}
        <box flexDirection="row" gap={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {t("userinfo.pty")}
          </text>
          <text fg={theme.text}>
            {session.hasPty ? t("userinfo.requested") : t("userinfo.notRequested")}
          </text>
        </box>
      </box>

      {/* Hint */}
      <text fg={theme.textMuted}>{t("common.escClose")}</text>
    </box>
  )
}

UserInfoDialog.show = (dialog: DialogContext) => {
  return new Promise<void>((resolve) => {
    dialog.setSize("large")
    dialog.replace(
      () => <UserInfoDialog />,
      () => resolve(),
    )
  })
}
