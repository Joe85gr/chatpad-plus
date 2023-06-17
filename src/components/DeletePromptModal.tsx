import { ActionIcon, Button, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-location";
import { useEffect, useState } from "react";
import { db, Prompt } from "../db";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";
import "../i18";
import { useTranslation } from "react-i18next";

export function DeletePromptModal({ prompt }: { prompt: Prompt }) {
  const { t, i18n } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [key, setKey] = useApiKey();

  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(key);
  }, [key]);
  const chatId = useChatId();
  const navigate = useNavigate();

  return (
    <>
      <Modal opened={opened} onClose={close} title={t("deletePromptModal.title")} size="md">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();
              await db.prompts.where({ id: prompt.id }).delete();
              close();

              notifications.show({
                title: t("deletePromptModal.notifications.deleted.title"),
                message: t("deletePromptModal.notifications.deleted.message"),
              });
            } catch (error: any) {
              if (error.toJSON().message === "Network Error") {
                notifications.show({
                  title: t("misc.notifications.neworkError.title"),
                  color: "red",
                  message: t("misc.notifications.neworkError.message"),
                });
              } else {
                notifications.show({
                  title: t("deletePromptModal.notifications.error.title"),
                  color: "red",
                  message: t("deletePromptModal.notifications.error.message"),
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Stack>
            <Text size="sm">{t("deletePromptModal.text")}</Text>
            <Button type="submit" color="red" loading={submitting}>
              {t("misc.deleteButton")}
            </Button>
          </Stack>
        </form>
      </Modal>
      <Tooltip label={t("deletePromptModal.label")}>
        <ActionIcon color="red" size="lg" onClick={open}>
          <IconTrash size={20} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}
