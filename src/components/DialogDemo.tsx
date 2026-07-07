/** @jsxImportSource @opentui/solid */
import { useDialog } from "../ui/dialog"
import { DialogConfirm } from "../ui/dialog-confirm"
import { DialogAlert } from "../ui/dialog-alert"
import { useTheme } from "../context/ThemeContext"

export function DialogDemo() {
  const dialog = useDialog()
  const { theme } = useTheme()

  const handleConfirm = async () => {
    const result = await DialogConfirm.show(dialog, "Confirm action", "Are you sure you want to do this?")
    if (result === true) {
      await DialogAlert.show(dialog, "Success", "The action was confirmed")
    } else if (result === false) {
      await DialogAlert.show(dialog, "Cancelled", "The action was cancelled")
    }
  }

  const handleAlert = async () => {
    await DialogAlert.show(dialog, "Notice", "This is a notice message")
  }

  return (
    <box flexDirection="row" gap={1}>
      <box
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={theme.primary}
        onMouseUp={handleConfirm}
      >
        <text fg={theme.selectedListItemText}>Confirm dialog</text>
      </box>
      <box
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={theme.accent}
        onMouseUp={handleAlert}
      >
        <text fg={theme.selectedListItemText}>Alert dialog</text>
      </box>
    </box>
  )
}
