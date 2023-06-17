import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { db } from "../db";
import "../i18";
import { useTranslation } from "react-i18next";

export function DeleteAllDataModal({ onOpen }: { onOpen: () => void }) {
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
        {t("deleteAllDataModal.title")}
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title={t("deleteAllDataModal.title")}
        size="md"
        withinPortal
      >
        <Stack>
          <Text size="sm">{t("deleteAllDataModal.text")}</Text>
          <Button
            onClick={async () => {
              await db.delete();
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
