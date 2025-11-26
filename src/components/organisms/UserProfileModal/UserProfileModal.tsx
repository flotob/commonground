// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./UserProfileModal.css";

import Scrollable from "components/molecules/Scrollable/Scrollable";
import { useUserData } from "context/UserDataProvider";
import UserProfileV2 from "components/molecules/UserProfileV2/UserProfileV2";

export type Props = {
  userId: string;
  showDeleteButton: boolean;
  hoveredMessageId?: string;
  channelId?: string;
  defaultView?: 'profile' | 'admin';
}

export type UserProfileModalState = 'content' | 'modSettings' | 'roles' | 'warn' | 'mute' | 'ban' | 'deleteMessage';

export default function UserProfileModal(props: Props) {
  const {
    userId,
    showDeleteButton,
    hoveredMessageId,
    channelId,
    defaultView
  } = props;

  const user = useUserData(userId);

  return (
    <div className="user-profile-modal-container">
      <Scrollable className="inner-container inherit-max-height" innerClassName="inherit-max-height">
        <div className="user-tooltip-inner user-profile-modal cg-border-xxl p-4 flex flex-col gap-4">
          {user && <UserProfileV2
            user={user}
            isFollowed={user.isFollowed}
            isFollower={user.isFollower}
            channelId={channelId}
            showDeleteMsgButton={showDeleteButton}
            hoveredMessageId={hoveredMessageId}
            otherSettingsOpen={defaultView === 'admin'}
            lockModal={undefined}
            linksToProfile
            enableAdminOptions
          />}
          {/* <div className="user-photo-container">
            <UserProfilePhoto userId={userId} />
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex gap-4">
              {modalControls}
            </div>

            <div className="flex flex-col p-1 gap-1">
              <div className="flex justify-between gap-2">
                <div className="flex-1 overflow-hidden">
                  <div className="user-profile-modal-nickname" onClick={navigateToProfile}>
                    {user && getDisplayName(user)}
                    {user?.onlineStatus && user?.onlineStatus !== 'offline' && <StatusIndicator status={user?.onlineStatus}/>}
                  </div>
                </div>

                {currentPage !== 'content' && <div className="user-role-count flex items-center gap-1">
                  <span>
                    `${commContext.state === 'loaded' && commContext.members[userId]?.roleIds.length} roles`
                  </span>
                  <RoleIcon />
                </div>}
              </div>
              {currentPage === 'content' && <SocialSection user={user} detailledData={detailledData} observedRef={observedRef} />}
            </div>
            {currentPage === 'content' && <UserProfileUserContent
              userId={userId}
              navigateToProfile={navigateToProfile}
              user={user}
            />}
            {currentPage === 'modSettings' && <UserProfileModSettings showDeleteButton={showDeleteButton} isInChannel={isInChannel} setCurrentPage={setCurrentPage} />}
            {currentPage === 'roles' && <UserProfileRoles userId={userId} />}
            {currentPage === 'warn' && <UserProfileWarn onWarnReasonChange={onWarnReasonChange} />}
            {currentPage === 'mute' && <UserProfileMuteBan type='mute' onMuteOrBan={onMuteDurationChange} />}
            {currentPage === 'ban' && <UserProfileMuteBan type='ban' onMuteOrBan={onBanDurationChange} />}
            {currentPage === 'deleteMessage' && <UserProfileDeleteMessage onDeleteMessageTriggerClick={onDeletePost} />}
          </div> */}
        </div>
      </Scrollable>
    </div>
  )
}

