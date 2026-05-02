import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";

import { type Lang, strings } from "@/constants/i18n";

interface LangContextType {
  lang: Lang;
  t: typeof strings.ar;
  toggleLang: () => void;
  isRTL: boolean;
}

const LangContext = createContext<LangContextType>({
  lang: "ar",
  t: strings.ar,
  toggleLang: () => {},
  isRTL: true,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    AsyncStorage.getItem("dawerli_lang").then((saved) => {
      if (saved === "ar" || saved === "en") {
        setLang(saved);
      }
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "ar" ? "en" : "ar";
      AsyncStorage.setItem("dawerli_lang", next);
      return next;
    });
  }, []);

  const isRTL = lang === "ar";

  return (
    <LangContext.Provider value={{ lang, t: strings[lang], toggleLang, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
