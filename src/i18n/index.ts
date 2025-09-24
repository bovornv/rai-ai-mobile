import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";

import th from "./locales/th.json";
import en from "./locales/en.json";

const STORAGE_KEY = "lang";

export async function initI18n() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  // Always default to Thai unless user explicitly changed it
  const fallback = "th";
  const device = RNLocalize.getLocales()?.[0]?.languageCode ?? "th";
  const initial = saved || fallback; // ignore device; requirement says Thai default

  await i18n
    .use(initReactI18next)
    .init({
      resources: { th: { translation: th }, en: { translation: en } },
      lng: initial,
      fallbackLng: "th",
      compatibilityJSON: "v3",
      interpolation: { escapeValue: false },
    });

  return i18n;
}

export async function setLang(lng: "th" | "en") {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(STORAGE_KEY, lng);
}

export default i18n;
