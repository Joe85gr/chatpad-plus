import {
  Alert,
  Anchor,
  Button,
  Flex,
  List,
  Modal,
  PasswordInput,
  TextInput,
  Select,
  Stack,
  Text,
  DefaultMantineColor,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { db } from "../db";
import { config } from "../utils/config";
import { checkOpenAIKey } from "../utils/openai";
import { availableLanguages, changeLanguage, getCurrentLanguage } from "../i18";
import "../i18";
import { useTranslation } from "react-i18next";

export function SettingsModal({ children }: { children: ReactElement }) {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const { t, i18n } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [value, setValue] = useState("");

  const [theme, setTheme] = useLocalStorage<DefaultMantineColor>({ 
    key: "mantine-theme",
    defaultValue: config.defaultTheme,
    getInitialValueInEffect: true,
  });
  const [model, setModel] = useState(config.defaultModel);
  const [type, setType] = useState(config.defaultType);
  const [auth, setAuth] = useState(config.defaultAuth);
  const [base, setBase] = useState("");
  const [version, setVersion] = useState("");

  const settings = useLiveQuery(async () => {
    return db.settings.where({ id: "general" }).first();
  });

  useEffect(() => {
    window.dispatchEvent(new Event("theme-changed"));
  }, [theme]);

  useEffect(() => {
    if (settings?.openAiApiKey) {
      setValue(settings.openAiApiKey);
    }
    if (settings?.openAiModel) {
      setModel(settings.openAiModel);
    }
    if (settings?.openAiApiType) {
      setType(settings.openAiApiType);
    }
    if (settings?.openAiApiAuth) {
      setAuth(settings.openAiApiAuth);
    }
    if (settings?.openAiApiBase) {
      setBase(settings.openAiApiBase);
    }
    if (settings?.openAiApiVersion) {
      setVersion(settings.openAiApiVersion);
    }
  }, [settings]);

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal opened={opened} onClose={close} title={t("settingsModal.title")} size="lg">
        <Stack>
          <form
            onSubmit={async (event) => {
              try {
                setSubmitting(true);
                event.preventDefault();
                await checkOpenAIKey(value);
                await db.settings.where({ id: "general" }).modify((apiKey) => {
                  apiKey.openAiApiKey = value;
                });
                notifications.show({
                  title: t("settingsModal.notifications.apiKeySaved.title"),
                  message: t("settingsModal.notifications.apiKeySaved.message"),
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Flex gap="xs" align="end">
              <PasswordInput
                label={t("settingsModal.apiKeyLabel")}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                sx={{ flex: 1 }}
                value={value}
                onChange={(event) => setValue(event.currentTarget.value)}
                formNoValidate
              />
              <Button type="submit" loading={submitting}>
                {t("misc.saveButton")}
              </Button>
            </Flex>
          </form>
          <List withPadding>
            <List.Item>
              <Text size="sm">
                <Anchor
                  href="https://platform.openai.com/account/api-keys"
                  target="_blank"
                >
                  {t("settingsModal.apiKeyText1")}
                </Anchor>
              </Text>
            </List.Item>
            <List.Item>
              <Text size="sm" color="dimmed">
                {t("settingsModal.apiKeyText2")}
              </Text>
            </List.Item>
          </List>
          <Select
            label={t("settingsModal.apiType")}
            value={type}
            onChange={async (value) => {
              setSubmitting(true);
              try {
                await db.settings.update("general", {
                  openAiApiType: value ?? 'openai',
                });
                notifications.show({
                  title: t("settingsModal.notifications.apiTypeSaved.title"),
                  message: t("settingsModal.notifications.apiTypeSaved.message"),
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
            withinPortal
            data={[
              { "value": "openai", "label": "OpenAI"},
              { "value": "custom", "label": "Custom (e.g. Azure OpenAI)"}
            ]}
          />
          <Select
            label={t("settingsModal.apiModelLabel")}
            value={model}
            onChange={async (value) => {
              setSubmitting(true);
              try {
                await db.settings.update("general", {
                  openAiModel: value ?? undefined,
                });
                notifications.show({
                  title: t("settingsModal.notifications.apiModelSaved.title"),
                  message: t("settingsModal.notifications.apiModelSaved.message"),
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
            withinPortal
            data={config.availableModels}
          />
          <Alert color="orange" title={t("settingsModal.warningTitle")}>
          {t("settingsModal.warningMessage")}
          </Alert>
          <Select
            label="OpenAI Auth (Custom Only)"
            value={auth}
            onChange={async (value) => {
              setSubmitting(true);
              try {
                await db.settings.update("general", {
                  openAiApiAuth: value ?? 'none',
                });
                notifications.show({
                  title: "Saved",
                  message: "Your OpenAI Auth has been saved.",
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
            withinPortal
            data={[{ "value": "none", "label": "None"}, { "value": "bearer-token", "label": "Bearer Token"}, { "value": "api-key", "label": "API Key"}]}
          />
          <form
            onSubmit={async (event) => {
              try {
                setSubmitting(true);
                event.preventDefault();
                await db.settings.where({ id: "general" }).modify((row) => {
                  row.openAiApiBase = base;
                  console.log(row);
                });
                notifications.show({
                  title: t("settingsModal.notifications.apiBaseSaved.title"),
                  message: t("settingsModal.notifications.apiBaseSaved.message"),
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Flex gap="xs" align="end">
              <TextInput
                label="OpenAI API Base (Custom Only)"
                placeholder="https://<resource-name>.openai.azure.com/openai/deployments/<deployment>"
                sx={{ flex: 1 }}
                value={base}
                onChange={(event) => setBase(event.currentTarget.value)}
                formNoValidate
              />
              <Button type="submit" loading={submitting}>
              {t("misc.saveButton")}
              </Button>
            </Flex>
          </form>
          <form
            onSubmit={async (event) => {
              try {
                setSubmitting(true);
                event.preventDefault();
                await db.settings.where({ id: "general" }).modify((row) => {
                  row.openAiApiVersion = version;
                  console.log(row);
                });
                notifications.show({
                  title: t("settingsModal.notifications.apiVersionSaved.title"),
                  message: t("settingsModal.notifications.apiVersionSaved.message"),
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: t("misc.notifications.neworkError.title"),
                    color: "red",
                    message: t("misc.notifications.neworkError.message"),
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: t("misc.notifications.error.title"),
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Flex gap="xs" align="end">
              <TextInput
                label="OpenAI API Version (Custom Only)"
                placeholder="2023-03-15-preview"
                sx={{ flex: 1 }}
                value={version}
                onChange={(event) => setVersion(event.currentTarget.value)}
                formNoValidate
              />
              <Button type="submit" loading={submitting}>
              {t("misc.saveButton")}
              </Button>
            </Flex>
            <Select
              mt="md"
              label={t("settingsModal.themeLabel")}
              value={theme}
              onChange={async (value: DefaultMantineColor) => {
                setSubmitting(true);
                setTheme(value.toLowerCase())

                notifications.show({
                  title: t("settingsModal.notifications.themeSaved.title"),
                  message: t("settingsModal.notifications.themeSaved.message"),
                });

                setSubmitting(false);
                
              }}
              withinPortal
              data={config.availableThemes}
            />
            <Select
              mt="md"
              label={t("settingsModal.languageLabel")}
              value={currentLanguage}
              onChange={async (value: DefaultMantineColor) => {
                setSubmitting(true);
                setCurrentLanguage(value);
                changeLanguage(value);

                notifications.show({
                  title: t("settingsModal.notifications.languageSaved.title"),
                  message: t("settingsModal.notifications.languageSaved.message"),
                });

                setSubmitting(false);
                
              }}
              withinPortal
              data={availableLanguages}
            />
          </form>
        </Stack>
      </Modal>
    </>
  );
}
