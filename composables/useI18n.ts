import { STRINGS, type Locale, type TKey } from "~/lib/i18n";

let wired = false;

export function useI18n() {
  const locale = useState<Locale>("wm-locale", () => "en");
  const dark = useState<boolean>("wm-dark", () => false);

  if (import.meta.client && !wired) {
    wired = true;
    const store = {
      get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
      set(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    };
    const saved = store.get("webmail-locale");
    if (saved === "fr" || saved === "en") locale.value = saved;
    if (store.get("webmail-theme") === "dark") dark.value = true;
    watch(locale, (v) => store.set("webmail-locale", v));
    watch(
      dark,
      (v) => {
        document.documentElement.classList.toggle("dark", v);
        store.set("webmail-theme", v ? "dark" : "light");
      },
      { immediate: true },
    );
  }

  const t = (key: TKey): string => STRINGS[locale.value][key];
  const dateLocale = computed(() => (locale.value === "fr" ? "fr-FR" : "en-US"));
  return { t, locale, dateLocale, dark };
}
