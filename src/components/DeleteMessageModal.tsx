import { ActionIcon, Button, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-location";
import { useEffect, useState } from "react";
import { db, Message } from "../db";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";
import { encode } from "gpt-token-utils";
import "../i18";
import { useTranslation } from "react-i18next";

export function DeleteMessageModal( { message }: { message: Message } ) {
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

  const removeMessage = async (message: Message | undefined, isAssistant: boolean) => { 
      if(!message) return;
      await db.messages.where({ id: message.id  }).delete();
      if(isAssistant) { 
        const tokensToRemove = encode(message.content).length;
        await db.chats.where("id").equals(message.chatId).modify((chat) => { chat.totalTokens -= tokensToRemove });
       } 
    };

  return (
    <>
      <Modal opened={opened} onClose={close} title={t("deleteMessageModal.title")} size="md">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();

              const messages = await db.messages.where("chatId").equals(message.chatId).sortBy("createdAt");

              await removeMessage(messages.pop(), true);
              await removeMessage(messages.pop(), false);

              if(messages.length === 0) {
                await db.chats.where("id").equals(message.chatId).modify({ description: "New Chat", totalTokens: 0});
              } 
              close();

              notifications.show({
                title: t("deleteMessageModal.notifications.deleted.title"),
                message: t("deleteMessageModal.notifications.deleted.message"),
              });
            } catch (error: any) {
              if (error.toJSON().message === "Network Error") {
                notifications.show({
                  title: t("misc.notifications.networkError.title"),
                  color: "red",
                  message: t("misc.notifications.networkError.message"),
                });
              } else {
                notifications.show({
                  title: t("misc.notifications.error.title"),
                  color: "red",
                  message:t("misc.notifications.error.message"),
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Stack>
            <Text size="sm">{t("deleteMessageModal.text")}</Text>
            <Button type="submit" color="red" loading={submitting}>
              {t("misc.deleteButton")}
            </Button>
          </Stack>
        </form>
      </Modal>
      <Tooltip label={t("deleteMessageModal.tooltip")} position="left">
        <ActionIcon onClick={open}>
          <IconX opacity={0.5} size={20}/>
        </ActionIcon>
      </Tooltip>
    </>
  );
}
