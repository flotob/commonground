// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./Assistant.css";
import assistantManager, { type AssistantStatus, type AssistantUpdateEvent } from "data/managers/assistantManager";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CaretDown, List, Spinner } from "@phosphor-icons/react";
import Scrollable, { ScrollableHandle } from "components/molecules/Scrollable/Scrollable";
import { useOwnUser } from "context/OwnDataProvider";
import { useWindowSizeContext } from "context/WindowSizeProvider";
import Button from "components/atoms/Button/Button";
import { ReactComponent as PaperPlaneIcon } from "components/atoms/icons/misc/PaperPlane.svg";
import TextAreaField from "components/molecules/inputs/TextAreaField/TextAreaField";
import ScreenAwareDropdown from "components/atoms/ScreenAwareDropdown/ScreenAwareDropdown";
import ListItem from "components/atoms/ListItem/ListItem";
import initialMessages from "common/assistant/initialMessages";
import chatApi from "data/api/chat";
import type OpenAI from "openai";
import { LiaToolsSolid } from "react-icons/lia";

type Props = {
  community?: Models.Community.DetailView;
  dialogId: string | null;
  newDialogCreated: (dialogId: string, createdAt: string, model: Assistant.ModelName) => void;
  setDialogListOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssistantToolUseComponent: React.FC<{ content: string }> = ({ content }) => {
  const [json, setJson] = useState<any>(null);

  useEffect(() => {
    try {
      setJson(JSON.parse(content.trim()));
    } catch (error) {
      console.warn("Error parsing tool call", content);
    }
  }, [content]);

  if (json) {
    let toolCallComponents: JSX.Element[] = [];
    let tools: any[] = json;
    if (!Array.isArray(json)) {
      tools = [json];
    }
    tools = tools.filter(tool => {
      if (typeof tool !== 'object') {
        console.warn("tool is not an object", tool);
        return false;
      }
      if (typeof tool.function !== 'object') {
        console.warn("tool.function is not an object", tool);
        return false;
      }
      if (typeof tool.function.name !== 'string') {
        console.warn("tool.function.name is not a string", tool);
        return false;
      }
      if (typeof tool.function.arguments !== 'string') {
        console.warn("tool.function.arguments is not a string", tool);
        return false;
      }
      else {
        try {
          tool.parsedArgs = JSON.parse(tool.function.arguments);
        }
        catch (error) {
          console.warn("Error parsing tool call arguments", tool.function.arguments);
          return false;
        }
      }
      return true;
    });
    toolCallComponents = tools.map(tool => (<div className="assistant-tool-use">
      <div className="flex flex-row gap-3 items-center w-full">
        <LiaToolsSolid className="w-6 h-6 ml-1" />
        <div className="grow">{tool.function.name}({Object.keys(tool.parsedArgs).map(arg => `${arg}=${tool.parsedArgs[arg]}`).join(', ')})</div>
      </div>
    </div>));

    return <>{toolCallComponents}</>;
  }
  return <div className="assistant-tool-use"><Spinner className="spinner" /></div>
};

// Define custom components with TypeScript types
const codeComponent: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = (match && match[1]) || '';
  if (language === 'tool_code') {
    return <AssistantToolUseComponent content={String(children).replace(/\n$/, '')} />;
  }
  else if (!!language) {
    return (
      <SyntaxHighlighter
        style={prism}
        language={language}
        PreTag={"div"}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }
  return (
    <code className={`${className} p-1 border border-gray-300 rounded-md`}>
      {children}
    </code>
  );
};

const Assistant: React.FC<Props> = ({ community, dialogId, newDialogCreated, setDialogListOpen }) => {
  const [userInput, setUserInput] = useState<string>("");
  const [availableAssistants, setAvailableAssistants] = useState<{
    modelName: Assistant.ModelName,
    title: string,
    isAvailable: boolean,
  }[]>([]);
  const [model, setModel] = useState<Assistant.ModelName | undefined>(undefined);
  const ownData = useOwnUser();
  const newChatOptions = useMemo(() => {
    if (!!community) {
      return {
        template: 'community_v1' as const,
        communityTitle: community.title,
      };
    }
    else if (!!ownData) {
      const userDisplayName = ownData.accounts.find(acc => acc.type === ownData.displayAccount)?.displayName || '';
      return {
        template: 'user_v1' as const,
        userDisplayName,
      };
    }
  }, [community?.title, ownData?.accounts, ownData?.displayAccount]);

  const [messages, setMessages] = useState<OpenAI.Chat.ChatCompletionMessageParam[]>(dialogId === null && !!newChatOptions ? assistantManager.getNewChat(newChatOptions) : []);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(dialogId !== null);

  const refreshTimeoutRef = useRef<any>(null);
  const scrollableRef = useRef<ScrollableHandle>(null);
  const dialogIdRef = useRef<string | null>(null);
  const scrollToBottomRef = useRef<boolean>(false);

  const { isMobile } = useWindowSizeContext();

  useEffect(() => {
    chatApi.getAssistantAvailability().then(result => {
      setAvailableAssistants(result.assistants);
      if (!model) {
        const assistant = result.assistants.find(assistant => assistant.isAvailable);
        if (assistant) {
          setModel(assistant.modelName);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!!dialogId) {
      if (dialogIdRef.current !== dialogId) {
        setLoading(true);
        assistantManager.getExistingChat({ dialogId }).then(result => {
          const _messages = result.messages;
          const { model } = result;
          if (dialogIdRef.current !== dialogId) {
            return;
          }
          setModel(model);
          setLoading(false);
          setMessages(() => {
            const result = _messages.map(message => {
              if (message.role === 'assistant' && message.tool_calls?.length) {
                return {
                  role: 'assistant' as const,
                  content: message.content + "\n" + message.tool_calls.map(toolCall => `\`\`\`tool_code\n${JSON.stringify(toolCall)}\n\`\`\``).join('\n'),
                };
              }
              else {
                return message;
              }
            });
            // Add initial assistant message, since it's not included in the conversation history
            if (result[0]?.role === 'user' && !!newChatOptions) {
              if (newChatOptions.template === 'community_v1') {
                result.unshift({
                  role: 'assistant' as const,
                  content: initialMessages.community_v1(newChatOptions.communityTitle),
                });
              }
              else if (newChatOptions.template === 'user_v1') {
                result.unshift({
                  role: 'assistant' as const,
                  content: initialMessages.user_v1(newChatOptions.userDisplayName),
                });
              }
            }
            return result;
          });
          scrollToBottomRef.current = true;
        });
      }
    }
    else {
      const assistant = availableAssistants.find(a => a.isAvailable);
      if (assistant) {
        setModel(assistant.modelName);
      }
      else {
        setModel(undefined);
      }
      setLoading(false);
      setMessages(!!newChatOptions ? assistantManager.getNewChat(newChatOptions) : []);
    }
    dialogIdRef.current = dialogId;
  }, [dialogId, community?.id]);

  useEffect(() => {
    const listener = (event: AssistantUpdateEvent) => {
      if (event.type === 'statusUpdate' && event.status.dialogId === dialogIdRef.current) {
        setStatus(event.status);
      }
      else if (event.type === 'messageComplete' && event.dialogId === dialogIdRef.current) {
        setMessages(old => [...old, { role: 'assistant', content: event.message }]);
      }
    };
    setStatus(assistantManager.status);
    assistantManager.addListener(listener);
    return () => assistantManager.removeListener(listener);
  }, []);

  useEffect(() => {
    if (scrollToBottomRef.current) {
      setTimeout(() => {
        scrollableRef.current?.scrollToBottom();
        scrollToBottomRef.current = false;
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!model) {
      return;
    }
    assistantManager.sendChatMessage({
      message: userInput,
      dialogId,
      communityId: community?.id || null,
      model,
    }).then(result => {
      if (!dialogId && !!result?.dialogId) {
        dialogIdRef.current = result.dialogId;
        newDialogCreated(result.dialogId, result.createdAt, model);
      }
      setMessages(old => [...old, { role: 'user', content: userInput }]);
      setUserInput("");
    });
  };

  const getPriorityName = useCallback((priority: number) => {
    switch (priority) {
      case 0:
        return "Gold Users";
      case 1:
        return "Silver Users";
      case 2:
        return "Free Users";
      default:
        return "Throttled Users";
    }
  }, []);

  useLayoutEffect(() => {
    scrollableRef.current?.scrollToBottom();
  }, [status?.response || undefined]);

  const modelIsAvailable = useMemo(() => {
    return availableAssistants.find(a => a.modelName === model)?.isAvailable || false;
  }, [availableAssistants, model]);

  return <div className="ai-assistant">
    <div className="ai-assistant-header">
      <div className="ai-assistant-header-model">
        <div className="cg-caption-md-600 cg-text-secondary">
          Model
        </div>
        {!dialogId ? (
          <ScreenAwareDropdown
            items={availableAssistants.map((assistant) => (<ListItem
              key={assistant.modelName}
              title={assistant.title}
              propagateEventsOnClick={true}
              onClick={() => assistant.isAvailable && setModel(assistant.modelName)}
              disabled={!assistant.isAvailable}
            />))}
            triggerContent={<Button
              text={model ? availableAssistants.find(assistant => assistant.modelName === model)?.title : "Select Model"}
              role="secondary"
              iconRight={<CaretDown className="w-5 h-5" />}
            />}
            closeOnClick={true}
          />
        ) : (
          <div className="cg-text-main ml-4">
            {model ? availableAssistants.find(assistant => assistant.modelName === model)?.title : "Select Model"}
          </div>
        )}
      </div>
      {!!isMobile && <Button
        role="secondary"
        iconRight={<List className="w-7 h-7" />}
        onClick={() => setDialogListOpen(true)}
      />}
    </div>
    <Scrollable
      innerClassName="ai-assistant-messages"
      ref={scrollableRef}
    >
      {loading && <div className="ai-assistant-messages-loading">
        <Spinner className="spinner" />
      </div>}
      {!loading && messages.map((message, index) => {
        if (message.role === 'assistant') {
          return (
            <div className="ai-assistant-messages-assistant">
              <Markdown
                children={message.content as string}
                components={{
                  code: codeComponent,
                }}
              />
            </div>
          );
        }
        else {
          return (
            <div className="ai-assistant-messages-user">
              {message.content as string}
            </div>
          );
        }
      })}
      {!loading && status?.dialogId === dialogId && !!status?.response && (
        <div className="ai-assistant-messages-assistant">
          <Markdown
            children={status.response}
            components={{
              code: codeComponent,
            }}
          />
        </div>
      )}
      {!loading && status?.queueData && status.status !== 'PROCESSING' && (
        <div className="ai-assistant-queue-data">
          <div className="ai-assistant-queue-data-title">In Queue before you</div>
          {status.queueData.queuedBefore.map(([priority, countBefore]) => (
            <div className="ai-assistant-queue-data-item">
              <div className="ai-assistant-queue-data-item-priority">{getPriorityName(priority)}</div>
              <div className="ai-assistant-queue-data-item-count">{countBefore}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && status?.response === '' && status.status === 'PROCESSING' && (
        <div className="w-full p-2">
          <div className="flex flex-row items-center justify-center gap-2 w-full">
            <Spinner className="spinner" />
            <div className="cg-caption-md-600 cg-text-secondary">Processing...</div>
          </div>
        </div>
      )}
    </Scrollable>
    <div className="ai-assistant-input">
      <TextAreaField
        value={modelIsAvailable ? userInput : ""}
        inputClassName="ai-assistant-input-textarea"
        onChange={modelIsAvailable ? setUserInput : () => {}}
        placeholder={modelIsAvailable ? `Type your message here...` : `This model is currently unavailable`}
        autoGrow
        onKeyPress={e => {
          if (!e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        disabled={loading || (!!status && status.status !== 'FINISHED')}
      />

      <Button
        className="ai-assistant-input-button"
        role="secondary"
        text="Send"
        onClick={handleSendMessage}
        iconRight={<PaperPlaneIcon />}
        disabled={!modelIsAvailable}
      />
    </div>
  </div>
}

export default Assistant;