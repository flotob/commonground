// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useRef, useState } from "react";

import { validateGenericTextInput } from "../../../common/validators";
import errors from "../../../common/errors";

import data from "data";

import { InlineToastType } from "../../atoms/InlineToast/InlineToast";
import TextInputField from "../../molecules/inputs/TextInputField/TextInputField";
import TextAreaField from "../../molecules/inputs/TextAreaField/TextAreaField";
import UserProfilePhoto from "../../../components/molecules/UserProfilePhoto/UserProfilePhoto";
import ManagementHeader from "components/molecules/ManagementHeader/ManagementHeader";
import UserSocialLinksEditor from "../../../components/organisms/UserSocialLinksEditor/UserSocialLinksEditor";
import NewsletterSubscribeField from "../../../components/molecules/NewsletterSubscribeField/NewsletterSubscribeField";
import { useOwnUser } from "context/OwnDataProvider";
import { useWindowSizeContext } from "context/WindowSizeProvider";

import './UserProfileManagement.css';
import userApi from "data/api/user";

export default function UserProfileManagement() {
  const ownUser = useOwnUser();
  const { isMobile } = useWindowSizeContext();
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const cgProfile = ownUser?.accounts.find(a => a.type === 'cg');
  const extraData = cgProfile?.extraData as Models.User.UserAccountExtraData_CG | undefined;
  const [nickname, setNickname] = useState<string>(cgProfile?.displayName || '');
  const [nicknameError, setNicknameError] = useState<string>();
  const [nicknameLoading, setNicknameLoading] = useState<InlineToastType>();

  const [description, setDescription] = useState<string>(extraData?.description || '');
  const [descriptionError, setDescriptionError] = useState<string>();
  const [descriptionLoading, setDescriptionLoading] = useState<InlineToastType>();

  useEffect(() => {
    setNicknameError(validateGenericTextInput(nickname, 15));
  }, [nickname]);

  const handleNicknameKeyPress = async (e: React.KeyboardEvent<Element>) => {
    if (e.code === "Enter") {
      nicknameInputRef.current?.blur();
    }
  }

  const handleNicknameBlur = async () => {
    setNicknameLoading('loading');
    await saveAlias();
    setNicknameLoading('done');
  }

  const handleDescriptionKeyPress = async (e: React.KeyboardEvent<Element>) => {
    if (!e.shiftKey && e.code === "Enter") {
      descriptionInputRef.current?.blur();
    }
  }

  const handleDescriptionBlur = async () => {
    setDescriptionLoading('loading');
    await saveDescription();
    setDescriptionLoading('done');
  }


  const saveAlias = useCallback(async () => {
    if (!!ownUser && !!nickname && !nicknameError && nickname !== cgProfile?.displayName) {
      try {
        await userApi.updateUserAccount({ type: 'cg', displayName: nickname });
        setNicknameError(undefined);
      } catch(e) {
        setNicknameError(errors.client.NICKNAME_TAKEN);
      }
    }
  }, [nickname, ownUser, nicknameError, setNicknameError]);

  const saveDescription = useCallback(async () => {
    if (!!ownUser && !!description && !descriptionError && description !== extraData?.description) {
      try {
        await userApi.updateUserAccount({ type: 'cg', description });
        setDescriptionError(undefined);
      } catch (e) {
        setDescriptionError("Could not save description");
      }
    }
  }, [description, ownUser, descriptionError, setDescriptionError]);

  return (
    <div className="user-profile-management">
      {!isMobile && <ManagementHeader title="Manage your profile" />}
      <div className="user-profile-description">
        <UserProfilePhoto userId={ownUser?.id || ''} editMode  />
        <div className="user-name-editor">
          <TextInputField
            inputRef={nicknameInputRef}
            value={nickname}
            onChange={setNickname}
            placeholder="Set your nickname"
            labelClassName="inline-input-label"
            inputClassName="inline-input nickname-input"
            onKeyPress={handleNicknameKeyPress}
            onBlur={handleNicknameBlur}
            error={nicknameError}
            inlineToast={nicknameLoading}
          />
        </div>
        <div className="user-about-box">
          <div className="user-about-box-title">
            <span className="main-title">About me</span>
            <span className="sub-title">What makes you interesting?</span>
          </div>
          <TextAreaField
            inputRef={descriptionInputRef}
            value={description}
            onChange={setDescription}
            placeholder="Describe yourself"
            labelClassName="inline-input-label"
            inputClassName="inline-input description-input"
            onKeyPress={handleDescriptionKeyPress}
            onBlur={handleDescriptionBlur}
            error={descriptionError}
            inlineToast={descriptionLoading}
            rows={0}
            maxLetters={280}
          />
        </div>
        <div className="user-social-box">
          <div className="user-social-box-title">
            <span className="main-title">Links</span>
            <span className="sub-title">Add links to other platforms relevant for your community</span>
          </div>
          <UserSocialLinksEditor />
        </div>
        <div className="user-social-box">
          <div className="user-social-box-title">
            <span className="main-title">Newsletter</span>
            <span className="sub-title">Subscribe to our newsletter to receive the latest news about Common Ground.</span>
          </div>
          <NewsletterSubscribeField registerAsNewUser />
        </div>
      </div>
    </div>
  );
}