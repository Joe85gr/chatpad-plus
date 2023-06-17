import {
  ActionIcon,
  Button,
  Modal,
  Stack,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlaylistAdd, IconPlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { db } from "../db";
import "../i18";
import { useTranslation } from "react-i18next";


export function CreatePromptModal({ content }: { content?: string }) {
  const { t, i18n } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  useEffect(() => {
    setValue(content ?? "");
  }, [content]);

  return (
    <>
      {content ? (
        <Tooltip label="Save Prompt" position="left">
          <ActionIcon onClick={open}>
            <IconPlaylistAdd opacity={0.5} size={20} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Button fullWidth onClick={open} leftIcon={<IconPlus size={20} />}>
          {t("createPromptModal.newButton")}
        </Button>
      )}
      <Modal opened={opened} onClose={close} title={t("createPromptModal.title")} size="lg">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();
              const id = nanoid();
              db.prompts.add({
                id,
                title,
                content: value,
                createdAt: new Date(),
              });
              notifications.show({
                title: t("createPromptModal.notifications.success.title"),
                message: t("createPromptModal.notifications.success.message"),
              });
              close();
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
          <Stack>
            <TextInput
              label={t("createPromptModal.label")}
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              formNoValidate
              data-autofocus
            />
            <Textarea
              placeholder={t("createPromptModal.placeholder")}
              autosize
              minRows={5}
              maxRows={10}
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
            />
            <Button type="submit" loading={submitting}>
            {t("misc.saveButton")}
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
