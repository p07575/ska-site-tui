/** @jsxImportSource @opentui/solid */
import { TextAttributes, type SelectOption } from "@opentui/core";
import { createMemo } from "solid-js";
import { useTerminalDimensions } from "@opentui/solid";
import { useTheme } from "../context/ThemeContext";
import { useI18n, type Locale } from "../i18n";
import { useDialog, type DialogContext } from "./dialog";

export function LanguageDialog() {
  const dialog = useDialog();
  const { theme } = useTheme();
  const { t, locale, setLocale, locales } = useI18n();
  const dimensions = useTerminalDimensions();

  const selectHeight = createMemo(() => {
    const rowCount = locales.length;
    const maxByTerminal = Math.floor(dimensions().height / 2) - 6;
    return Math.max(1, Math.min(rowCount, maxByTerminal));
  });

  const options = createMemo(() =>
    locales.map((l) => ({ name: l.label, description: "", value: l.id })),
  );

  const initialIndex = createMemo(() => {
    const idx = locales.findIndex((l) => l.id === locale());
    return idx >= 0 ? idx : 0;
  });

  // Live preview: switch language as the highlight moves.
  const handleChange = (_index: number, option: SelectOption | null) => {
    if (option?.value) setLocale(option.value as Locale);
  };

  const handleConfirm = (_index: number, option: SelectOption | null) => {
    if (option?.value) setLocale(option.value as Locale);
    dialog.clear();
  };

  return (
    <box
      paddingLeft={2}
      paddingRight={2}
      flexDirection="column"
      flexGrow={1}
      flexShrink={1}
      paddingBottom={1}
    >
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {t("language.title")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>

      <box
        border={true}
        borderStyle="rounded"
        borderColor={theme.accent}
        flexGrow={1}
        flexShrink={1}
      >
        <select
          style={{
            backgroundColor: theme.backgroundPanel,
            textColor: theme.textMuted,
            focusedBackgroundColor: theme.backgroundElement,
            focusedTextColor: theme.text,
            selectedBackgroundColor: theme.accent,
            selectedTextColor: theme.text,
            descriptionColor: theme.textMuted,
            selectedDescriptionColor: theme.textMuted,
            showDescription: false,
            showScrollIndicator: true,
            wrapSelection: true,
            height: selectHeight(),
          }}
          options={options()}
          selectedIndex={initialIndex()}
          focused={true}
          keyBindings={[{ name: "enter", action: "select-current" }]}
          onChange={handleChange}
          onSelect={handleConfirm}
        />
      </box>

      <text>{t("language.hint")}</text>
    </box>
  );
}

LanguageDialog.show = (dialog: DialogContext) => {
  return new Promise<void>((resolve) => {
    dialog.setSize("medium");
    dialog.replace(
      () => <LanguageDialog />,
      () => resolve(),
    );
  });
};
