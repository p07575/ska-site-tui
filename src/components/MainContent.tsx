/** @jsxImportSource @opentui/solid */
import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/ThemeContext"

export function MainContent() {
  const { theme, selected } = useTheme()

  return (
    <scrollbox
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: "auto",
        minWidth: 20,
        height: "auto",
        flexDirection: "column",
        backgroundColor: theme.background,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
        scrollY: true,
      }}
    >
      {/* Title Section */}
      <box
        style={{
          height: 5,
          border: true,
          borderStyle: "single",
          borderColor: theme.border,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 1,
        }}
      >
        <text style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>
          🎨 主题效果展示
        </text>
        <text style={{ fg: theme.textMuted }}>
          当前主题: {selected()}
        </text>
      </box>

      {/* Color Palette Section */}
      <box
        style={{
          height: 10,
          border: true,
          borderStyle: "single",
          borderColor: theme.border,
          flexDirection: "column",
          padding: 1,
        }}
      >
        <text style={{ fg: theme.accent, attributes: TextAttributes.BOLD }}>
          调色板
        </text>
        <box style={{ flexDirection: "row", height: 3 }}>
          <box style={{ flexGrow: 1, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Primary</text>
          </box>
          <box style={{ flexGrow: 1, backgroundColor: theme.secondary, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Secondary</text>
          </box>
          <box style={{ flexGrow: 1, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Accent</text>
          </box>
        </box>
        <box style={{ flexDirection: "row", height: 3 }}>
          <box style={{ flexGrow: 1, backgroundColor: theme.error, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Error</text>
          </box>
          <box style={{ flexGrow: 1, backgroundColor: theme.warning, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Warning</text>
          </box>
          <box style={{ flexGrow: 1, backgroundColor: theme.success, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Success</text>
          </box>
          <box style={{ flexGrow: 1, backgroundColor: theme.info, alignItems: "center", justifyContent: "center" }}>
            <text style={{ fg: theme.text }}>Info</text>
          </box>
        </box>
      </box>

      {/* Status Indicators Section */}
      <box
        style={{
          height: 8,
          border: true,
          borderStyle: "single",
          borderColor: theme.border,
          flexDirection: "column",
          padding: 1,
        }}
      >
        <text style={{ fg: theme.accent, attributes: TextAttributes.BOLD }}>
          状态指示器
        </text>
        <box style={{ flexDirection: "row", height: 1 }}>
          <text style={{ fg: theme.error }}>  ✗ 错误状态</text>
          <text style={{ fg: theme.warning }}>  ⚠ 警告状态</text>
          <text style={{ fg: theme.success }}>  ✓ 成功状态</text>
          <text style={{ fg: theme.info }}>  ℹ 信息状态</text>
        </box>
        <box style={{ flexDirection: "row", height: 1 }}>
          <text style={{ fg: theme.text }}>  普通文本</text>
          <text style={{ fg: theme.textMuted }}>  次要文本</text>
        </box>
      </box>

      {/* Border Examples Section */}
      <box
        style={{
          height: 8,
          border: true,
          borderStyle: "single",
          borderColor: theme.border,
          flexDirection: "column",
          padding: 1,
        }}
      >
        <text style={{ fg: theme.accent, attributes: TextAttributes.BOLD }}>
          边框样式
        </text>
        <box style={{ flexDirection: "row", height: 3 }}>
          <box
            style={{
              flexGrow: 1,
              border: true,
              borderStyle: "single",
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <text style={{ fg: theme.textMuted }}>默认边框</text>
          </box>
          <box
            style={{
              flexGrow: 1,
              border: true,
              borderStyle: "double",
              borderColor: theme.borderActive,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <text style={{ fg: theme.text }}>活跃边框</text>
          </box>
          <box
            style={{
              flexGrow: 1,
              border: true,
              borderStyle: "rounded",
              borderColor: theme.borderSubtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <text style={{ fg: theme.textMuted }}>微妙边框</text>
          </box>
        </box>
      </box>

      {/* Panel Examples Section */}
      <box
        style={{
          height: 8,
          flexDirection: "column",
          padding: 1,
        }}
      >
        <text style={{ fg: theme.accent, attributes: TextAttributes.BOLD }}>
          面板样式
        </text>
        <box style={{ flexDirection: "row", height: 3 }}>
          <box
            style={{
              flexGrow: 1,
              backgroundColor: theme.backgroundPanel,
              border: true,
              borderStyle: "single",
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <text style={{ fg: theme.text }}>面板背景</text>
          </box>
          <box
            style={{
              flexGrow: 1,
              backgroundColor: theme.backgroundElement,
              border: true,
              borderStyle: "single",
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <text style={{ fg: theme.text }}>元素背景</text>
          </box>
        </box>
      </box>
    </scrollbox>
  );
}
