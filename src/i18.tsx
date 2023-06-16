import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './assets/translations/en.json';
import it from './assets/translations/it.json';
import { SelectItem } from "@mantine/core";

export const availableLanguages: SelectItem[] = [ 
    {label: "English", value: "en"},
    {label: "Italian", value: "it"},
];

i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources : {
            en,
            it
        },
        fallbackLng: "en",
        lng: 'en',
        interpolation: {
            escapeValue: false
        }}
    );

export default i18n;

export async function changeLanguage(language: string) {
    console.log("Changing language to:", language)
    // 
    await i18n.changeLanguage(language);
};

export function getCurrentLanguage() {
    return i18n.language;
}