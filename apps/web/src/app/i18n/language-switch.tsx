import { parseLanguage, useI18n } from "../../shared/i18n";
import { changeLanguage } from "./language-preference";

export function LanguageSwitch() {
  const { t, i18n, language } = useI18n();
  return (
    <select
      aria-label={t("ui.language")}
      className="min-h-11 max-w-32 shrink-0 cursor-pointer rounded-control border border-current/30 bg-surface px-2 py-2 text-small text-charcoal focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2"
      onChange={(event) => {
        const next = parseLanguage(event.target.value);
        changeLanguage(next, i18n);
      }}
      value={language}
    >
      <option lang="en" value="en">
        English
      </option>
      <option lang="zh-CN" value="zh-CN">
        简体中文
      </option>
      <option lang="ja" value="ja">
        日本語
      </option>
    </select>
  );
}
