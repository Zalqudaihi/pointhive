import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ar from "./locales/ar";

const STORAGE_KEY = "pointhive.lang";

export function getSavedLang(): string {
  return localStorage.getItem(STORAGE_KEY) || "en";
}

export function applyDirection(lang: string) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getSavedLang(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

applyDirection(getSavedLang());

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDirection(lng);
});

export default i18n;
