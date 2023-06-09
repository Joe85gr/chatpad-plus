import { SelectItem } from "@mantine/core";
import { Dictionary } from "lodash";

interface Config {
    defaultModel: SelectItem["value"];
    defaultType: 'openai' | 'custom';
    defaultAuth: 'none' | 'bearer-token' | 'api-key';
    defaultBase: string;
    defaultVersion: string;
    defaultTheme: string;
    defaultKey: string;
    availableModels: SelectItem[];
    availableThemes: SelectItem[];
    writingCharacters: SelectItem[];
    colors: Dictionary<string>;
    writingTones: string[];
    writingStyles: string[];
    writingFormats: SelectItem[];
    showDownloadLink: boolean;
    allowDarkModeToggle: boolean;
    allowSettingsModal: boolean;
    allowDatabaseModal: boolean;
    showTwitterLink: boolean;
    showFeedbackLink: boolean;
    showFirstMessageDescription: boolean;
}

export let config: Config;

export const loadConfig = async () => {
    const response = await fetch("config.json");
    config = await response.json();
    return config;
};
