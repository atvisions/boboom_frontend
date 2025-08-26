"use client";
import { useI18n } from "@/context/I18nProvider";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as any)}
      className="bg-white/10 text-sm rounded px-2 py-1 hover:bg-white/20"
    >
      <option value="zh">中文</option>
      <option value="en">EN</option>
    </select>
  );
}


