/** @jsxImportSource @opentui/solid */
import { useTheme } from "../context/ThemeContext"

export function MainContent() {
  const { theme } = useTheme()

  return (
    <scrollbox
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: "auto",
        minWidth: 20,
        height: "auto",
        backgroundColor: theme.background,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
        scrollY: true,
      }}
    >
    </scrollbox>
  );
}
