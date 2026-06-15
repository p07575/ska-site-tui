/** @jsxImportSource @opentui/solid */
import { createMemo } from "solid-js";
import { TextAttributes, type SelectOption, type SelectKeyBinding } from "@opentui/core";
import { useTheme } from "../context/ThemeContext";

export function Sidebar({ width }: { width: number }) {
  const { theme, selected, all, set } = useTheme();
  const themes = Object.keys(all());

  // Build SelectOption list from themes
  const options = createMemo(() =>
    themes.map((name) => ({ name, description: "", value: name })),
  );

  // Find initial selected index
  const initialIndex = createMemo(() => {
    const idx = themes.indexOf(selected());
    return idx >= 0 ? idx : 0;
  });

  // Handle theme selection from <select>
  const handleSelect = (_index: number, option: SelectOption | null) => {
    if (option?.value) {
      set(option.value);
    }
  };

  return (
    <box
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: width,
        minWidth: 20,
        height: "auto",
        flexDirection: "column",
        backgroundColor: theme.backgroundPanel,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header */}
      <box
        style={{
          height: 3,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <text
          style={{
            bg: theme.background,
            fg: theme.text,
            attributes:
              TextAttributes.BOLD |
              TextAttributes.ITALIC |
              TextAttributes.STRIKETHROUGH,
          }}
        >
          🎨 主题效果展示
        </text>
      </box>

      {/* Instructions */}
      <box
        style={{
          height: 2,
          backgroundColor: theme.backgroundElement,
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 1,
        }}
      >
        <text style={{ fg: theme.textMuted }}>↑↓选择 | Enter确认</text>
      </box>

      {/* Theme List - using native <select> component */}
      <select
        style={{
          flexGrow: 1,
          backgroundColor: theme.backgroundPanel,
          textColor: theme.textMuted,
          focusedBackgroundColor: theme.backgroundElement,
          focusedTextColor: theme.text,
          selectedBackgroundColor: theme.accent,
          selectedTextColor: theme.text,
          descriptionColor: theme.textMuted,
          selectedDescriptionColor: theme.textMuted,
          showDescription: false,
          showScrollIndicator: false,
          wrapSelection: false,
        }}
        options={options()}
        selectedIndex={initialIndex()}
        focused={true}
        keyBindings={[{ name: "enter", action: "select-current" }]}
        onSelect={handleSelect}
      />

      {/* Footer Info */}
      <box
        style={{
          height: 6,
          border: true,
          borderStyle: "single",
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <text style={{ fg: theme.textMuted }}>当前是{selected()}</text>
        <text style={{ fg: theme.textMuted }}>
          共{themes.length}
          个主题
        </text>
      </box>
    </box>
  );
}
