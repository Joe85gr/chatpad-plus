import { Group, MantineColor, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { useLiveQuery } from "dexie-react-hooks";
import { config } from "../utils/config";
import { Chat, db } from "../db";

interface MainLinkProps {
  icon: React.ReactNode;
  label: string;
  chat: Chat;
}

export function MainLink({ icon, label, chat }: MainLinkProps) {
  const firstMessage = useLiveQuery(async () => {
    return (await db.messages.orderBy("createdAt").toArray()).filter(
      (m) => m.chatId === chat.id
    )[0];
  }, [chat]);

  return (
    <UnstyledButton
      sx={(theme) => ({
        // display: "block",
        width: "100%",
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color:
          theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
      })}
    >
      <Group>
        <ThemeIcon variant="light">
          {icon}
        </ThemeIcon>
        <Text
          size="sm"
          style={{
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            flex: 1,
            width: 0,
          }}
        >
          {label} <br />
          {config.showFirstMessageDescription && firstMessage?.content}
        </Text>
      </Group>
    </UnstyledButton>
  );
}
