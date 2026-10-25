import type { en } from "./locales/en";

export type SupportedLanguage = "en" | "zh-CN" | "ja";
export type TranslationResource = {
  [Group in keyof typeof en]: { [Key in keyof (typeof en)[Group]]: string };
};
export type TranslationKey = {
  [Group in keyof typeof en]: `${Group}.${keyof (typeof en)[Group] & string}`;
}[keyof typeof en];
export type TranslationValues = Readonly<Record<string, unknown>>;
export type Translate = (key: TranslationKey, values?: TranslationValues) => string;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
    enableSelector: false;
    returnNull: false;
    strictKeyChecks: true;
  }
}
