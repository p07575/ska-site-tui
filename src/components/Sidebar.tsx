/** @jsxImportSource @opentui/solid */
import { useTheme } from "../context/ThemeContext";

export function Sidebar({ width }: { width: number }) {
  const { theme } = useTheme();

  return (
    <box
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: width,
        minWidth: 20,
        height: "auto",
        flexDirection: "column",
        backgroundColor: theme.background,
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
      }}
    >
    </box>
  );
}
