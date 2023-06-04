import {
  ActionIcon,
  Box,
  Card,
  Code,
  CopyButton,
  Flex,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { IconCheck, IconCopy, IconUser, IconClipboard } from "@tabler/icons-react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkGfm from "remark-gfm";
import { Message } from "../db";
import "../styles/markdown.scss";
import { CreatePromptModal } from "./CreatePromptModal";
import { LogoIcon } from "./Logo";
import { vscode } from "./MarkdownStyles";

export function MessageItem({ message }: { message: Message }) {
  const clipboard = useClipboard({ timeout: 500 });
  const wordCount = useMemo(() => {
    var matches = message.content.match(/[\w\d\’\'-\(\)]+/gi);
    return matches ? matches.length : 0;
  }, [message.content]);

  const customStyle = {
    padding: "20px",
    }

  return (
      <Card withBorder>
        <Flex gap="sm">
          {message.role === "user" && (
            <ThemeIcon color="gray" size="lg">
              <IconUser size={20} />
            </ThemeIcon>
          )}
          {message.role === "assistant" && <LogoIcon style={{ height: 32 }} />}
          <Box sx={{ flex: 1, width: 0 }} className="markdown">
            <ReactMarkdown
              children={message.content}
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <Table verticalSpacing="sm" highlightOnHover {...props} />
                ),
                code({ node, inline, className, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if(!inline && match) {
                    return  (

                      <Box sx={{ position: "relative" }}>
                      <SyntaxHighlighter
                        showLineNumbers
                        showInlineLineNumbers
                        
                        customStyle={customStyle}
                        style={vscode}
                        language={match[1]}
                        PreTag="div" {...props}>
                      </SyntaxHighlighter>
                      <CopyButton value={String(props.children)}>
                        {({ copied, copy }) => (
                          <Tooltip
                            label={copied ? "Copied" : "Copy Block"}
                            position="left"
                          >
                            <ActionIcon
                              sx={{ position: "absolute", top: 4, right: 4 }}
                              onClick={copy}
                            >
                              { copied ? 
                                <IconCheck opacity={0.4} size={20} /> 
                                : <IconCopy opacity={0.4} size={20} />
                              }
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Box>

                    ) 
                  }
                  else if(inline) {
                    return (
                      <Code {...props} />
                    )
                  } else {
                    return (
                      <Box sx={{ position: "relative" }}>
                        <Code block {...props} />
                        <CopyButton value={String(props.children)}>
                          {({ copied, copy }) => (
                            <Tooltip
                              label={copied ? "Copied" : "Copy Block"}
                              position="left"
                            >
                              <ActionIcon
                                sx={{ position: "absolute", top: 4, right: 4 }}
                                onClick={copy}
                              >
                              { copied ? 
                                <IconCheck opacity={0.4} size={20} /> 
                                : <IconCopy opacity={0.4} size={20} />
                              }
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Box>
                    )
                  }
              }}}
            />
            {message.role === "assistant" && (
              <Box>
                <Text size="sm" color="dimmed">
                  {wordCount} words
                </Text>
              </Box>
            )}
          </Box>
          <Box>
            <CreatePromptModal content={message.content} />
            <CopyButton value={message.content}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied" : "Copy Prompt"} position="left">
                  <ActionIcon onClick={copy}>
                  { copied ? <IconCheck opacity={0.4} size={20} /> : <IconClipboard opacity={0.4} size={20} /> }
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Box>
        </Flex>
      </Card>
  );
}
