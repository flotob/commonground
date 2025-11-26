// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import React, { useCallback, useEffect } from 'react';
import communityApi from 'data/api/community';
import useLocalStorage from 'hooks/useLocalStorage';
import { useOwnUser } from 'context/OwnDataProvider';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { useEmailConfirmationContext } from 'context/EmailConfirmationProvider';

type DeniedCommunities = {
  [communityId: string]: Date;
};

const JoinNewsletterBanner: React.FC = () => {
  const [deniedCommunityJoining, setDeniedCommunityJoining] = useLocalStorage<DeniedCommunities>({}, 'DeniedCommunitiesNewsletter');
  const { ownRolesById, community } = useLoadedCommunityContext();
  const communityJoined = ownRolesById.size > 0;
  const [isVisible, setIsVisible] = React.useState(false);
  const { openModal } = useEmailConfirmationContext();
  const user = useOwnUser();

  useEffect(() => {
    const newsLetterActive = community.myNewsletterEnabled || false;
    const deniedDate = deniedCommunityJoining[community.id];
    const deniedUntil = new Date(deniedDate);
    const now = new Date();
    const isDenied = deniedDate && deniedUntil > now;
    setIsVisible(!newsLetterActive && !isDenied && communityJoined && community.enablePersonalNewsletter);
  }, [community.id, community.myNewsletterEnabled, deniedCommunityJoining, communityJoined, community.enablePersonalNewsletter]);
    

  const onClickJoinNewsletter = useCallback(async () => {
    try {
      if (!user?.email) {
        openModal("signup");
        return;
      }
      await communityApi.subscribeToCommunityNewsletter({ communityIds: [community.id] });
    } catch (error) {
      console.error(error);
    }
  }, [community.id, openModal, user?.email]);

  const onClickDeny = useCallback(() => {
    setDeniedCommunityJoining({
      ...deniedCommunityJoining,
      [community.id]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }, [community.id, deniedCommunityJoining, setDeniedCommunityJoining]);


  return isVisible ? (
    <div className='grid grid-flow-row gap-5 items-center p-4 cg-bg-subtle cg-border-subtle cg-border-xxl cg-text-lg-500 cg-text-main'>
      <span className='cg-text-lg-500 text-center'>Never miss new posts from this community</span>
      <div className='flex flex-col w-full px-4 gap-3.5'>
        <Button
          role='primary'
          text='Join Newsletter'
          onClick={onClickJoinNewsletter}
        />
        <Button
          role='secondary'
          text='Not now'
          onClick={onClickDeny}
        />
      </div>
    </div>
  ) : null;
}

export default React.memo(JoinNewsletterBanner);