/** @jsxImportSource @opentui/solid */
import { useTheme } from "../context/ThemeContext";
import { GifPlayer } from "./GifPlayer";
import { Image } from "./Image";
// @ts-ignore
import gifSrc from "../assets/e1480db31caad4ac819f5d777930218f.gif" with { type: "image/gif" };

export function Sidebar({ width }: { width: number }) {
  const { theme } = useTheme();

  return (
    <box
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: width,
        minWidth: 32,
        height: "auto",
        flexDirection: "column",
        backgroundColor: theme.background,
        // backgroundColor: "#ffffff",//修改底色，这样看起来明显一点。
        alignItems: "stretch",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
      }}
    >
      <GifPlayer src={gifSrc} width={64} />
    </box>
  );
}
