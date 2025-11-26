// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Assistant from "components/templates/CommunityLobby/Assistant/Assistant";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./AssistantView.css";
import { useOwnUser } from "context/OwnDataProvider";
import chatApi from "data/api/chat";
import dayjs from "dayjs";
import Scrollable from "components/molecules/Scrollable/Scrollable";
import ChatsMenu from "components/organisms/ChatsMenu/ChatsMenu";
import BottomSliderModal from "components/atoms/BottomSliderModal/BottomSliderModal";
import Button from "components/atoms/Button/Button";
import { PlusCircle, TrashSimple } from "@phosphor-icons/react";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";

type Props = {
  community?: Models.Community.DetailView;
}

export default function AssistantView(props: Props) {
  const { community } = props;
  const { isMobile } = useWindowSizeContext();
  const [dialogs, setDialogs] = useState<API.Chat.getOwnAssistantChats.Response>([]);
  const [selectedDialog, setSelectedDialog] = useState<string | null>(null);
  const [dialogListOpen, setDialogListOpen] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const ownUser = useOwnUser();

  useEffect(() => {
    if (!!ownUser?.id) {
      const requestData: API.Chat.getOwnAssistantChats.Request = !!community ? {
        type: 'community',
        communityId: community.id,
      } : {
        type: 'user',
      };
      chatApi.getOwnAssistantChats(requestData).then(dialogs => {
        setDialogs(dialogs.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt))));
      });
    }
  }, [ownUser?.id, community?.id]);

  const newDialogCreated = useCallback((dialogId: string, createdAt: string, model: Assistant.ModelName) => {
    setDialogs(dialogs => [{ dialogId, createdAt, updatedAt: createdAt, model }, ...dialogs]);
    setSelectedDialog(dialogId);
  }, []);

  const dialogList = useMemo(() => {
    return <Scrollable
      className="ai-assistant-dialog-list-scrollable"
      innerClassName="ai-assistant-dialog-list cg-content-stack"
    >
      <Button
        role="secondary"
        iconRight={<div className="p-2">
          <PlusCircle weight="duotone" className="w-5 h-5" />
        </div>}
        text="New Conversation"
        onClick={() => {
          setSelectedDialog(null);
          setDialogListOpen(false);
        }}
        active={selectedDialog === null}
        className="p-1 pl-4 flex flex-row items-center justify-between cursor-pointer"
      />
      {dialogs.map(dialog => (
        <Button
          role="secondary"
          key={dialog.dialogId}
          onClick={() => {
            setSelectedDialog(dialog.dialogId);
            setDialogListOpen(false);
          }}
          active={selectedDialog === dialog.dialogId}
          className="p-1 pl-4 flex flex-row items-center justify-between cursor-pointer"
          text={dayjs(dialog.createdAt).format('DD.MM.YYYY HH:mm')}
          iconRight={<Button
            role="secondary"
            iconLeft={<TrashSimple weight="duotone" className="w-5 h-5" />}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialog(dialog.dialogId);
            }}
          />}
        />
      ))}
    </Scrollable>;
  }, [selectedDialog, dialogs]);

  if (!ownUser?.id) {
    return <div className="flex flex-col items-center justify-center h-full">
      Assistant is only available for logged in users.
    </div>;
  }

  return <div className="ai-assistant-view">
    {!isMobile && dialogList}
    {!!isMobile && <BottomSliderModal
      isOpen={dialogListOpen}
      onClose={() => setDialogListOpen(false)}
    >
      {dialogList}
    </BottomSliderModal>}
    <Assistant
      community={community}
      dialogId={selectedDialog}
      newDialogCreated={newDialogCreated}
      setDialogListOpen={setDialogListOpen}
    />
    <ScreenAwareModal
      isOpen={!!deleteDialog}
      onClose={() => setDeleteDialog(null)}
      hideHeader
    >
      <h3>
        Do you really want to delete this conversation?
      </h3>
      <div className="flex flex-row gap-2 w-full justify-end">
        <Button
          role="secondary"
          text="Cancel"
          onClick={() => {
            setDeleteDialog(null);
          }}
        />
        <Button
          role="primary"
          text="Delete"
          onClick={() => {
            if (!!deleteDialog) {
              setDeleteDialog(null);
              chatApi.deleteAssistantChat({ dialogId: deleteDialog }).then(() => {
                setDialogs(dialogs => dialogs.filter(dialog => dialog.dialogId !== deleteDialog));
              });
            }
          }}
        />
      </div>
    </ScreenAwareModal>
  </div>;
}