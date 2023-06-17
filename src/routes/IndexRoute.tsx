import {
  Badge,
  Button,
  Center,
  Container,
  DefaultMantineColor,
  Group,
  SimpleGrid,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCurrencyDollar,
  IconKey,
  IconLock,
  IconNorthStar,
} from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Logo } from "../components/Logo";
import { SettingsModal } from "../components/SettingsModal";
import { db } from "../db";
import { config } from "../utils/config";
import { useLocalStorage } from "@mantine/hooks";
import "../i18";
import { useTranslation } from "react-i18next";


export function IndexRoute() {
  const { t, i18n } = useTranslation()
  const settings = useLiveQuery(() => db.settings.get("general"));
  const { openAiApiKey } = settings ?? {};
  const [userTheme, setUserThemeTheme] = useLocalStorage<DefaultMantineColor>({ 
    key: "mantine-theme",
    defaultValue: config.defaultTheme,
    getInitialValueInEffect: true,
  });

  const features = [
    {
      icon: IconCurrencyDollar,
      title: t('indexRoute.features.1.title'),
      description: t('indexRoute.features.1.description'),
    },
    {
      icon: IconLock,
      title: t('indexRoute.features.2.title'),
      description: t('indexRoute.features.2.description'),
    },
    {
      icon: IconNorthStar,
      title: t('indexRoute.features.2.title'),
      description: t('indexRoute.features.2.description'),
    },
  ];
  function forceUpdate() {
    throw new Error("Function not implemented.");
  }
  

  return (
    <>
      <Center py="xl" sx={{ height: "100%" }}>
        <Container size="sm">
          <Badge mb="lg">{t("indexRoute.badge")}</Badge>
          <Text color={userTheme}>
            <Logo style={{ maxWidth: 240 }}  />
          </Text>
          <Text mt={4} size="xl">
            {t("indexRoute.descriptionText")}
          </Text>
          <SimpleGrid
            mt={50}
            cols={3}
            spacing={30}
            breakpoints={[{ maxWidth: "md", cols: 1 }]}
          >
            {features.map((feature) => (
              <div key={feature.title}>
                <ThemeIcon variant="outline" size={50} radius={50}>
                  <feature.icon size={26} stroke={1.5} />
                </ThemeIcon>
                <Text mt="sm" mb={7}>
                  {feature.title}
                </Text>
                <Text size="sm" color="dimmed" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Text>
              </div>
            ))}
          </SimpleGrid>
          <Group mt={50}>
            {config.allowSettingsModal && (
              <SettingsModal>
                <Button
                  size="md"
                  variant={openAiApiKey ? "light" : "filled"}
                  leftIcon={<IconKey size={20} />}
                >
                  {openAiApiKey ? t("indexRoute.changeKeyButton") : t("indexRoute.enterKeyButton")}
                </Button>
              </SettingsModal>
            )}
          </Group>
        </Container>
      </Center>
    </>
  );
}
