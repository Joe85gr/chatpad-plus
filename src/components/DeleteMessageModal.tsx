import { ActionIcon, Button, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-location";
import { useEffect, useState } from "react";
import { db, Message } from "../db";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";

export function DeleteMessageModal( { message }: { message: Message } ) {
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
      <Modal opened={opened} onClose={close} title="Delete Prompt" size="md">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();
              await db.messages.where({ id: message.id  }).delete();
              const messages = await db.messages.where("chatId").equals(message.chatId).sortBy("createdAt");

              const lastMessage = messages.pop();
              await db.messages.where({ id: lastMessage?.id  }).delete();
                
              if(messages.length === 0) {
                await db.chats.where("id").equals(message.chatId).modify({ description: "New Chat"});
              }
              close();

              notifications.show({
                title: "Deleted",
                message: "Prompt deleted.",
              });
            } catch (error: any) {
              if (error.toJSON().message === "Network Error") {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message: "No internet connection.",
                });
              } else {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message:
                    "Can't remove chat. Please refresh the page and try again.",
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Stack>
            <Text size="sm">Are you sure you want to delete this prompt?</Text>
            <Button type="submit" color="red" loading={submitting}>
              Delete
            </Button>
          </Stack>
        </form>
      </Modal>
      <Tooltip label="Delete Prompt">
        <ActionIcon color="red" onClick={open}>
          <IconX />
        </ActionIcon>
      </Tooltip>
    </>
  );
}
