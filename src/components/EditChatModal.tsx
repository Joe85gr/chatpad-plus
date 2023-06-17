import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { Chat, db } from "../db";
import "../i18";
import { useTranslation } from "react-i18next";

export function EditChatModal({
  chat,
  children,
}: {
  chat: Chat;
  children: ReactElement;
}) {
  const { t, i18n } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(chat?.description ?? "");
  }, [chat]);

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal opened={opened} onClose={close} title={ t("editChatModal.title")} withinPortal>
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();
              await db.chats.where({ id: chat.id }).modify((chat) => {
                chat.description = value;
              });
              notifications.show({
                title: t("editChatModal.notifications.saved.title"),
                message:  t("editChatModal.notifications.saved.message"),
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
              label={t("editChatModal.label")}
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
              formNoValidate
              data-autofocus
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
