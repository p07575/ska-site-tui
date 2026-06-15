/** @jsxImportSource @opentui/solid */
import { useDialog } from "../ui/dialog"
import { DialogConfirm } from "../ui/dialog-confirm"
import { DialogAlert } from "../ui/dialog-alert"
import { useTheme } from "../context/ThemeContext"

export function DialogDemo() {
  const dialog = useDialog()
  const { theme } = useTheme()

  const handleConfirm = async () => {
    const result = await DialogConfirm.show(dialog, "确认操作", "你确定要执行此操作吗？")
    if (result === true) {
      await DialogAlert.show(dialog, "成功", "操作已确认执行")
    } else if (result === false) {
      await DialogAlert.show(dialog, "取消", "操作已取消")
    }
  }

  const handleAlert = async () => {
    await DialogAlert.show(dialog, "提示", "这是一个提示信息")
  }

  return (
    <box flexDirection="row" gap={1}>
      <box
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={theme.primary}
        onMouseUp={handleConfirm}
      >
        <text fg={theme.selectedListItemText}>确认对话框</text>
      </box>
      <box
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={theme.accent}
        onMouseUp={handleAlert}
      >
        <text fg={theme.selectedListItemText}>提示对话框</text>
      </box>
    </box>
  )
}
