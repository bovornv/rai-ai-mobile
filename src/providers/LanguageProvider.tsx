import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { initI18n } from "../i18n";
import { useFonts, NotoSansThai_400Regular, NotoSansThai_700Bold } from "@expo-google-fonts/noto-sans-thai";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_700Bold,
  });

  useEffect(() => {
    (async () => {
      await initI18n();
      if (fontsLoaded) {
        setReady(true);
        SplashScreen.hideAsync();
      }
    })();
  }, [fontsLoaded]);

  if (!ready) return null;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
