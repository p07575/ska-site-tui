import { createContext, useContext, createSignal, createEffect, createMemo, type ParentProps } from "solid-js"
import { useRenderer } from "@opentui/solid"
import {
  allThemes,
  hasTheme,
  resolveTheme,
  subscribeThemes,
  type Theme,
  type ThemeJson,
} from "../theme"

export type ThemeContextValue = {
  theme: Theme
  selected: () => string
  all: () => Record<string, ThemeJson>
  has: (name: string) => boolean
  set: (name: string) => boolean
  mode: () => "dark" | "light"
  setMode: (mode: "dark" | "light") => void
}

const ThemeContext = createContext<ThemeContextValue>()

export function ThemeProvider(props: ParentProps & { defaultTheme?: string; defaultMode?: "dark" | "light" }) {
  const defaultTheme = props.defaultTheme ?? "opencode"
  const defaultMode = props.defaultMode ?? "dark"

  const renderer = useRenderer()
  const [activeTheme, setActiveTheme] = createSignal<string>(defaultTheme)
  const [mode, setMode] = createSignal<"dark" | "light">(defaultMode)
  const [themes, setThemes] = createSignal<Record<string, ThemeJson>>(allThemes())

  subscribeThemes((t) => setThemes(t))

  const theme = createMemo(() => {
    const themeJson = themes()[activeTheme()]
    if (themeJson) return resolveTheme(themeJson, mode())
    const opencodeTheme = themes().opencode
    if (opencodeTheme) return resolveTheme(opencodeTheme, mode())
    throw new Error("No theme available")
  })

  createEffect(() => {
    if (renderer && theme().background) {
      renderer.setBackgroundColor(theme().background)
    }
  })

  const themeProxy = new Proxy({} as Theme, {
    get(_target, prop) {
      return (theme() as any)[prop]
    },
  })

  const value: ThemeContextValue = {
    theme: themeProxy,
    selected: activeTheme,
    all: allThemes,
    has: hasTheme,
    set: (name: string) => {
      if (!hasTheme(name)) return false
      setActiveTheme(name)
      return true
    },
    mode,
    setMode: (m: "dark" | "light") => setMode(m),
  }

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return value
}
