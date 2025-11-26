// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from "components/atoms/Button/Button";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";
import { useSnackbarContext } from "context/SnackbarContext";
import dayjs from "dayjs";
import useLocalStorage, { deleteEntry } from "hooks/useLocalStorage";
import React, { useCallback, useState } from "react";

export type ArticleBackup = Omit<Models.BaseArticle.DetailView, "articleId" | "creatorId"> & {
  rolePermissions: Models.Community.CommunityArticlePermission[]
  updatedAt: string;
};

export const useArticleBackup = (articleId: string | undefined) => {
  const [articleBackup, setArticleBackup] = useLocalStorage<ArticleBackup | undefined>(undefined, `articleBackup-${articleId}`);
  const deleteBackup = useCallback(() => {
    deleteEntry(`articleBackup-${articleId}`);
  }, [articleId]);

  return { articleBackup, setArticleBackup, deleteBackup };
}

type Props = {
  articleId: string | undefined;
  onRestoreBackup: () => void;
  articleBackup: ArticleBackup | undefined;
  updatedAt: string;
}

const ArticleBackupModal: React.FC<Props> = (props) => {
  const { showSnackbar } = useSnackbarContext();
  const [modalVisible, setModalVisible] = useState(true);
  const currentUpdateTime = dayjs(props.updatedAt);
  const backupUpdateTime = dayjs(props.articleBackup?.updatedAt);
  const isBackupMoreRecent = !props.updatedAt || currentUpdateTime.isBefore(backupUpdateTime);

  return <ScreenAwareModal
    isOpen={modalVisible && !!props.articleBackup && isBackupMoreRecent}
    onClose={() => setModalVisible(false)}
    title="Unsaved draft found"
  >
    <div className="flex flex-col gap-8 items-center justify-center">
      <span>We found a newer version of this post on your device. Would you like to restore it?</span>
      <div className="flex flex-col">
        <span className="cg-text-lg-400">Current post time: {currentUpdateTime.format('MMM DD, HH:mm')}</span>
        <span className="cg-text-lg-500">Newer draft time: {backupUpdateTime.format('MMM DD, HH:mm')}</span>
      </div>
      <div className="flex flex-col gap-2 items-center justify-center w-full">
        <Button
          className="w-full"
          role="primary"
          text='Restore newer draft'
          onClick={() => {
            props.onRestoreBackup();
            showSnackbar({type: 'info', text: 'Article restored'});
            setModalVisible(false);
          }}
        />
        <Button
          className="w-full"
          role="secondary"
          text='Discard'
          onClick={() => setModalVisible(false)}
        />
      </div>
    </div>
  </ScreenAwareModal>
}

export default React.memo(ArticleBackupModal);