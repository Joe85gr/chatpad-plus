import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  MediaQuery,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { KeyboardEvent, useState, type ChangeEvent, useRef, useEffect } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { MessageItem } from "../components/MessageItem";
import { db } from "../db";
import { useChatId } from "../hooks/useChatId";
import { config } from "../utils/config";
import {
  createChatCompletion,
  createStreamChatCompletion,
} from "../utils/openai";
import { ScrollIntoView } from "../components/ScrollIntoView";
import { IconPlayerStopFilled, IconRefresh } from "@tabler/icons-react";
import { ChatCompletionRequestMessage } from "openai";
import { encode } from "gpt-token-utils";
import { set } from "lodash";

export function ChatRoute() {
  const chatId = useChatId();
  const apiKey = useLiveQuery(async () => {
    return (await db.settings.where({ id: "general" }).first())?.openAiApiKey;
  });
  const messages = useLiveQuery(() => {
    if (!chatId) return [];
    return db.messages.where("chatId").equals(chatId).sortBy("createdAt");
  }, [chatId]);
  const userMessages =
    messages
      ?.filter((message) => message.role === "user")
      .map((message) => message.content) || [];
  const [userMsgIndex, setUserMsgIndex] = useState(0);
  const [content, setContent] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  const chat = useLiveQuery(async () => {
    if (!chatId) return null;
    return db.chats.get(chatId);
  }, [chatId]);

  const [writingCharacter, setWritingCharacter] = useState<string | null>(null);
  const [writingTone, setWritingTone] = useState<string | null>(null);
  const [writingStyle, setWritingStyle] = useState<string | null>(null);
  const [writingFormat, setWritingFormat] = useState<string | null>(null);
  const [completition, setCompletion] = useState<XMLHttpRequest>();

  const getSystemMessage = async (chatId: string) => {

    if(chatId) {
      const existing = await db.chats.get(chatId);
      if(existing && existing.systemMessage) {
        return existing.systemMessage;
      }
    }

    const systemMessages: string[] = [];
    if (writingCharacter) systemMessages.push(`Talk Like ${writingCharacter}.`);
    if (writingTone) systemMessages.push(`Reply in ${writingTone} tone.`);
    if (writingStyle) systemMessages.push(`Reply in ${writingStyle} style.`);
    if (writingFormat) systemMessages.push(writingFormat);
    if (systemMessages.length === 0)
      systemMessages.push(
        "You are ChatGPT, a helpful AI."
      );

    const systemMessage = systemMessages.join(" ");

    db.chats.update(chatId, { systemMessage: systemMessage });
    
    return systemMessage;
  };

  const submit = async (regenerateMessage: boolean = false) => {
    if (submitting) return;

    if (!chatId) {
      notifications.show({
        title: "Error",
        color: "red",
        message: "chatId is not defined. Please create a chat to get started.",
      });
      return;
    }

    if (!apiKey) {
      notifications.show({
        title: "Error",
        color: "red",
        message: "OpenAI API Key is not defined. Please set your API Key",
      });
      return;
    }

    try {
      setSubmitting(true);

      if(!regenerateMessage) {

        await db.messages.add({
          id: nanoid(),
          chatId,
          content,
          role: "user",
          createdAt: new Date(),
        });
        setContent("");
      }

      const messageId = nanoid();
      await db.messages.add({
        id: messageId,
        chatId,
        content: "█",
        role: "assistant",
        createdAt: new Date(),
      });

      const requestMessages: ChatCompletionRequestMessage[] = [
        ...(messages ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        }))
      ];

      if(!regenerateMessage) {
        requestMessages.push({ role: "user", content });
      }

      requestMessages.push({
        role: "system",
        content: await getSystemMessage(chatId),
      });

      const stream = await createStreamChatCompletion(
        apiKey,
        requestMessages,
        chatId,
        messageId,
        setStreaming
      );

      setCompletion(stream);

      setSubmitting(false);

      if (chat?.description === "New Chat") {
        const messages = await db.messages
          .where({ chatId })
          .sortBy("createdAt");

        const firstMessageContent = messages[0].content;

        const createChatDescription = await createChatCompletion(apiKey, [
          {
            role: "user",
            content: `tl;dr of the following text, max 4 words: "${firstMessageContent}"`
          },
        ]);
        const chatDescription =
          createChatDescription.data.choices[0].message?.content;

        if (createChatDescription.data.usage) {
          await db.chats.where({ id: chatId }).modify((chat) => {
            chat.description = chatDescription ?? "New Chat";
            if (chat.totalTokens) {
              chat.totalTokens +=
                createChatDescription.data.usage!.total_tokens;
            } else {
              chat.totalTokens = createChatDescription.data.usage!.total_tokens;
            }
          });
        }
      }
    } catch (error: any) {

      setStreaming(false);
      
      if (error.toJSON().message === "Network Error") {
        notifications.show({
          title: "Error",
          color: "red",
          message: "No internet connection.",
        });
      }
      const message = error.response?.data?.error?.message;
      if (message) {
        notifications.show({
          title: "Error",
          color: "red",
          message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  async function stop() {
    if (completition) {
      completition.abort();
      setSubmitting(false);
      setStreaming(false);
    }
  }

  async function regenerateResponse() {
    
    const lastMessage = messages?.pop();

    if(lastMessage) {
      let lastMessageTokens = encode(lastMessage.content).length;
      await db.messages.where({ id: lastMessage.id }).delete();
      await db.chats.where({ id: lastMessage.chatId }).modify((chat) => { chat.totalTokens -= lastMessageTokens;});
    }
    
    submit(true);
  }

  const onUserMsgToggle = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (
      !["ArrowUp", "ArrowDown"].includes(event.code) ||
      selectionStart !== selectionEnd ||
      (event.code === "ArrowUp" && selectionStart !== 0) ||
      (event.code === "ArrowDown" &&
        selectionStart !== event.currentTarget.value.length)
    ) {
      // do nothing
      return;
    }
    event.preventDefault();

    const newMsgIndex = userMsgIndex + (event.code === "ArrowUp" ? 1 : -1);
    const allMessages = [contentDraft, ...Array.from(userMessages).reverse()];

    if (newMsgIndex < 0 || newMsgIndex >= allMessages.length) {
      // index out of range, do nothing
      return;
    }
    setContent(allMessages.at(newMsgIndex) || "");
    setUserMsgIndex(newMsgIndex);
  };

  const onContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.currentTarget;
    setContent(value);
    setContentDraft(value);
    setUserMsgIndex(0);
  };

  useEffect(() => {
    ScrollIntoView(messagesEndRef)
  }, [messages]);

  if (!chatId) return null;
  
  return (
    <>
      <Container pt="xl" pb={140}>
        <Stack spacing="xs">
          {messages?.map((message, index) => (
            <MessageItem key={message.id} message={message} isLastUserMessage={index == messages.length - 2}/>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        {submitting && (
          <Card withBorder mt="xs">
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} width="70%" radius="xl" />
          </Card>
        )}
      </Container>
      <Box
        py="lg"
        sx={(theme) => ({
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          [`@media (min-width: ${theme.breakpoints.md})`]: {
            left: 300,
          },
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.gray[0],
        })}
      >
        <Container>
          {messages?.length === 0 && (
            <SimpleGrid
              mb="sm"
              spacing="xs"
              breakpoints={[
                { minWidth: "sm", cols: 4 },
                { maxWidth: "sm", cols: 2 },
              ]}
            >
              <Select
                value={writingCharacter}
                onChange={setWritingCharacter}
                data={config.writingCharacters}
                placeholder="Character"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingTone}
                onChange={setWritingTone}
                data={config.writingTones}
                placeholder="Tone"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingStyle}
                onChange={setWritingStyle}
                data={config.writingStyles}
                placeholder="Style"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingFormat}
                onChange={setWritingFormat}
                data={config.writingFormats}
                placeholder="Format"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
            </SimpleGrid>
          )}
          <SimpleGrid cols={1} spacing="xs" verticalSpacing="xs">
            <Flex
                mb="xs"
                justify="center"
                align="center">
                {streaming && 
                <Button onClick={stop} leftIcon={<IconPlayerStopFilled size={20} />}>
                  Stop
                </Button>
                }
                {!streaming && messages?.length !== 0 &&
                <Button onClick={regenerateResponse} leftIcon={<IconRefresh size={20} />}>
                  Regenerate response 
                </Button>
                }
            </Flex>
            <Flex gap="sm">
              <Textarea
                key={chatId}
                sx={{ flex: 1 }}
                placeholder="Your message here..."
                autosize
                autoFocus
                disabled={submitting}
                minRows={1}
                maxRows={5}
                value={content}
                onChange={onContentChange}
                onKeyDown={async (event) => {
                  if (event.code === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                    setUserMsgIndex(0);
                  }
                  if (event.code === "ArrowUp") {
                    onUserMsgToggle(event);
                  }
                  if (event.code === "ArrowDown") {
                    onUserMsgToggle(event);
                  }
                }}
              />
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Button h="auto" onClick={() => { submit();  }}>
                  <AiOutlineSend />
                </Button>
              </MediaQuery>

            </Flex>

          </SimpleGrid>

        </Container>
      </Box>
    </>
  );
}
