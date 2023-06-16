import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { db } from "../db";
import "../i18";
import { useTranslation } from "react-i18next";

export function DeleteChatsModal({ onOpen }: { onOpen: () => void }) {
  const { t, i18n } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false, { onOpen });

  return (
    <>
      <Button
        onClick={open}
        variant="outline"
        color="red"
        leftIcon={<IconTrash size={20} />}
      >
        {t("deleteChatsModal.deleteButton")}
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title={t("deleteChatsModal.title")}
        size="md"
        withinPortal
      >
        <Stack>
          <Text size="sm">{t("deleteChatsModal.text")}</Text>
          <Button
            onClick={async () => {
              await db.chats.clear();
              await db.messages.clear();
              localStorage.clear();
              window.location.assign("/");
            }}
            color="red"
          >
            {t("misc.deleteButton")}
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
