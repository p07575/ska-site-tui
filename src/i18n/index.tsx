/** @jsxImportSource @opentui/solid */
import {
  createContext,
  useContext,
  createSignal,
  type ParentProps,
  type Accessor,
} from "solid-js";
import en from "./locales/en";
import zhTW from "./locales/zh-TW";

export type Messages = typeof en;
export type MessageKey = keyof Messages;

const catalogs = {
  en,
  "zh-TW": zhTW,
} satisfies Record<string, Messages>;

export type Locale = keyof typeof catalogs;

export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh-TW", label: "繁體中文" },
];

/** Resolve the server-wide default locale from DEFAULT_LOCALE (tolerant of a few aliases). */
export function resolveDefaultLocale(): Locale {
  const raw = (process.env.DEFAULT_LOCALE ?? "").trim();
  if (raw in catalogs) return raw as Locale;
  const lower = raw.toLowerCase();
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (["zh-tw", "zh_tw", "zh-hant", "zh"].includes(lower)) return "zh-TW";
  return "en";
}

export const DEFAULT_LOCALE: Locale = resolveDefaultLocale();

/** Fill `{name}` placeholders in a template string. */
export function format(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`,
  );
}

export interface I18nContextValue {
  locale: Accessor<Locale>;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locales: { id: Locale; label: string }[];
}

const I18nContext = createContext<I18nContextValue>();

export function I18nProvider(props: ParentProps & { defaultLocale?: Locale }) {
  const [locale, setLocaleSig] = createSignal<Locale>(
    props.defaultLocale ?? DEFAULT_LOCALE,
  );

  // `t` reads locale() on every call, so it stays reactive inside tracked scopes.
  const t = (
    key: MessageKey,
    params?: Record<string, string | number>,
  ): string => {
    const cat = (catalogs[locale()] ?? en) as Messages;
    const template = cat[key] ?? (en as Messages)[key] ?? key;
    return format(template, params);
  };

  const value: I18nContextValue = {
    locale,
    setLocale: (l: Locale) => {
      if (l in catalogs) setLocaleSig(l);
    },
    t,
    locales: LOCALES,
  };

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
