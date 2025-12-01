// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useMemo, useState } from 'react';
import data from 'data';
import GenericMessageList from '../../components/molecules/GenericMessageList/GenericMessageList';
import Message from '../../components/molecules/Message/Message';
import { type RendererProps } from '../../components/molecules/GenericMessageList/ScrollingMessageList/ScrollingMessageList';
import { useOwnUser } from 'context/OwnDataProvider';
import serviceWorkerManager from 'data/appstate/serviceWorker';
import communityDatabase from 'data/databases/community';

function RendererWithObserver(props: RendererProps & {
  visibilityObserver: IntersectionObserver;
  channelId: string;
}) {
  const { item, channelId, replyClick, allCurrentItemsByIdRef, scrollToMessage, canReply } = props;

  const { parentMessageId } = item;
  const [parentMessage, setParentMessage] = useState<Models.Message.Message | undefined>(!!parentMessageId ? allCurrentItemsByIdRef.current?.get(parentMessageId) : undefined);

  useEffect(() => {
    if (!!parentMessageId) {
      if (!!channelId && parentMessage?.id !== parentMessageId) {
        const existing = !!parentMessageId ? allCurrentItemsByIdRef.current?.get(parentMessageId) : undefined;
        if (existing) {
          setParentMessage(existing);
        }
        else {
          const resultPromise = data.channelManager.getMessageById(channelId, parentMessageId, (updatedMessage) => {
            setParentMessage(updatedMessage);
          }).then(result => {
            if (!!result.item) {
              setParentMessage(result.item);
            }
            return result;
          });

          return () => {
            resultPromise.then(result => result.unsubscribe());
          };
        }
      }
    }
    else if (!!parentMessage) {
      setParentMessage(undefined);
    }
  }, [parentMessageId, channelId]);

  const setReaction = useCallback((reaction: string): void => {
    if (!!channelId) {
      data.channelManager.setReaction(channelId, item, reaction);
    }
  }, []);

  const unsetReaction = useCallback(() => {
    data.channelManager.unsetReaction(channelId, item);
  }, []);

  const repliedTo = useMemo(() => {
    if (!!parentMessage) {
      return {
        id: parentMessage.id,
        senderId: parentMessage.botId || parentMessage.creatorId || '',
        body: parentMessage.body
      };
    }
    else {
      return null;
    }
  }, [parentMessage?.id, parentMessage?.updatedAt.getTime()]);

  return (
    <Message
      message={item}
      channelId={item.channelId}
      attachments={item.attachments}
      key={item.id}
      setReaction={setReaction}
      unsetReaction={unsetReaction}
      repliedTo={repliedTo}
      replyClick={replyClick}
      editClick={props.editClick}
      visibilityObserver={props.visibilityObserver}
      selected={props.selected}
      editing={props.editing}
      isolatedNewMsg={props.isolatedNewMsg}
      showTimestamp={props.showTimestamp}
      scrollToMessage={scrollToMessage}
      canReply={canReply}
    />
  );
}

export default function MessageViewInner(props: {
  channelId: string;
  communityId?: string;
  updateAutoPin?: boolean;
  writingForbiddenMessage?: string;
  channelName?: string;
  messageIdFocus?: string;
  hideInput?: boolean;
  onMobileFocus?: (focused: boolean) => void;
  callMode?: true;
}) {
  const {
    channelId,
    communityId,
    updateAutoPin,
    writingForbiddenMessage,
    channelName,
    messageIdFocus,
    hideInput,
    onMobileFocus,
    callMode
  } = props;
  const [replyTo, setReplyTo] = useState<{
    id: string,
    senderId: string,
    body: Models.Message.Body
  } | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<Models.Message.Message | undefined>(undefined);
  const ownUser = useOwnUser();

  // Hide reply when changing channels
  useEffect(() => {
    setReplyTo(null);
    !!channelId && serviceWorkerManager.channelVisited(channelId);
  }, [channelId]);

  const createMessage = useCallback(async (body: Models.Message.Body, attachments: Models.Message.Attachment[]) => {
    if (
      !!channelId && !!ownUser?.id &&
      (body.content.length > 0 || attachments.length > 0)
    ) {
      setReplyTo(null);
      if (updateAutoPin && communityId) {
        communityDatabase.setChannelPinState({
          channelId,
          communityId,
          pinType: 'autopin',
          pinnedUntil: (new Date(Date.now() + (24 * 3600 * 1000))).toISOString(),
        }).catch(e => {
          console.error('Error setting autopin', e);
        });
      }
      await data.channelManager.createMessage({
        body,
        parentMessageId: replyTo?.id || null,
        creatorId: ownUser.id,
        attachments,
        channelId,
      });
      return true;
    }
    return false;
  }, [channelId, ownUser?.id, replyTo?.id, communityId, updateAutoPin]);

  const editMessage = useCallback(async (originalMessage: Models.Message.Message, body: Models.Message.Body, attachments: Models.Message.Attachment[]) => {
    if (
      !!ownUser?.id &&
      (body.content.length > 0 || attachments.length > 0)
    ) {
      const newMessage = { ...originalMessage };
      if (replyTo?.id) {
        newMessage.parentMessageId = replyTo.id;
      } else {
        newMessage.parentMessageId = null;
      }

      await data.channelManager.editMessage(newMessage, {
        body,
        attachments,
      });
      setReplyTo(null);
      setMessageToEdit(undefined);
      return true;
    } else {
      setReplyTo(null);
      setMessageToEdit(undefined);
      return false;
    }
    
  }, [ownUser?.id, replyTo?.id]);

  const handleReplyClick = useCallback((id: string, senderId: string, body: Models.Message.Body) => {
    setReplyTo({ id, senderId, body });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleEditClick = useCallback(async (message: Models.Message.Message) => {
    setMessageToEdit(message);
    if (message.parentMessageId) {
      const { item, unsubscribe } = await data.channelManager.getMessageById(channelId, message.parentMessageId, () => {});
      if (item) {
        setReplyTo({
          id: item?.id,
          body: item.body,
          senderId: item.botId || item.creatorId || '',
        });
      }
      unsubscribe();
    }
  }, []);

  return (
    <GenericMessageList
      channelId={channelId}
      channelName={channelName}
      createMessage={createMessage}
      Renderer={RendererWithObserver}
      replyClick={handleReplyClick}
      editClick={handleEditClick}
      replyingTo={replyTo}
      cancelReply={handleCancelReply}
      messageToEdit={messageToEdit}
      editMessage={editMessage}
      writingForbiddenMessage={writingForbiddenMessage}
      messageIdFocus={messageIdFocus}
      hideInput={hideInput}
      onMobileFocus={onMobileFocus}
      callMode={callMode}
    />
  );
}