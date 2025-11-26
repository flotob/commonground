// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './CommunityRequirementsModal.css';
import React, { useEffect, useMemo, useState } from 'react';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import Button from 'components/atoms/Button/Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import ExternalIcon from 'components/atoms/ExternalIcon/ExternalIcon';
import { Tooltip } from 'components/atoms/Tooltip/Tooltip';
import { Check, Info } from '@phosphor-icons/react';
import PasswordField from 'components/molecules/PasswordField/PasswordField';
import { checkCommunityRequirements } from 'common/util';
import { useOwnUser } from 'context/OwnDataProvider';
import communityApi from 'data/api/community';
import { useCommunityOnboardingContext } from 'context/CommunityOnboardingProvider';
import { useCommunityJoinedContext } from 'context/CommunityJoinedProvider';
import { joinedProgressAfterQuestionnaire } from '../CommunityQuestionnaireModal/CommunityQuestionnaireModal';
import Tag from 'components/atoms/Tag/Tag';
import data from 'data';

type Props = {
  community: Models.Community.DetailView;
  onClose: () => void;
};

const CommunityRequirementsModal: React.FC<Props> = ({ community, onClose }) => {
  const { isMobile } = useWindowSizeContext();
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { password, setPassword, openQuestionnaireModal, openPendingModal } = useCommunityOnboardingContext();
  const { openModal: openJoinedModal } = useCommunityJoinedContext();
  const ownUser =  useOwnUser();

  const missingRequirements = useMemo(() => {
    if (!ownUser) return null;
    return checkCommunityRequirements(community.onboardingOptions?.requirements || {}, ownUser);
  }, [community.onboardingOptions?.requirements, ownUser]);

  useEffect(() => {
    setPasswordError(false);
  }, [password]);

  const onNext = async () => {
    let valid = true;
    setLoading(true);
    if (community.onboardingOptions?.passwordProtected?.enabled && password) {
      // checkPassword
      const result = await communityApi.verifyCommunityPassword({
        communityId: community.id,
        password
      });
      if (!result.valid) {
        setPasswordError(true);
        valid = false;
      }
    }

    if (!!missingRequirements) {
      valid = false;
    }

    setLoading(false);
    if (valid) {
      if (community.onboardingOptions?.questionnaire?.enabled) {
        setPassword(password);
        openQuestionnaireModal(community);
      } else {
        await data.community.joinCommunity({
          id: community.id,
          password
        });
        
        joinedProgressAfterQuestionnaire({
          community,
          openJoinedModal,
          openPendingModal
        });
      }
    }
  }

  const hasLuksoProfile = !missingRequirements?.failedRequirements.includes('universalProfile');
  const hasXProfile = !missingRequirements?.failedRequirements.includes('xAcc');
  const hasOldAcc = !missingRequirements?.failedRequirements.includes('accTime');
  const btnDisabled = !!missingRequirements || (community.onboardingOptions?.passwordProtected?.enabled && (password?.length === 0 || passwordError));

  return (<ScreenAwareModal
    customClassname='community-requirements-modal relative cg-text-main'
    isOpen={true}
    onClose={onClose}
    hideHeader
    modalRootStyle={{ zIndex: 10101 }}
  >
    {!isMobile && <Button
      className='absolute top-4 right-4 cg-circular z-10'
      role='secondary'
      iconLeft={<XMarkIcon className='w-6 h-6' />}
      onClick={onClose}
    />}
    <div className={`flex flex-col items-center justify-center gap-6 flex-1 self-stretch ${isMobile ? 'px-4 pb-4' : 'p-8'}`}>
      <div className='p-12'>
        <CommunityPhoto community={community} size='large' noHover />
      </div>
      <span className='cg-heading-3 cg-text-main text-center'>There are requirements for {community.title}</span>
      {community.onboardingOptions?.passwordProtected?.enabled && <PasswordField
        label=''
        sublabel=''
        placeholder='Enter password'
        password={password || ''}
        setPassword={setPassword}
      />}
      {passwordError && <Tag variant='warning' label='Sorry, the password doesn’t look right.' className='requirement-tag' />}
      {community.onboardingOptions?.requirements?.enabled && <div className='requirements-container flex flex-col cg-border-xl w-full'>
        {community.onboardingOptions.requirements.universalProfileEnabled && <div className='flex p-4 gap-2 justify-between'>
          <div className={`flex flex-col gap-1 flex-1 ${hasLuksoProfile ? ' opacity-50' : ''}`}>
            <span className='cg-text-lg-500'>Requires</span>
            <div className='flex items-center gap-2'>
              <ExternalIcon type='lukso' className='w-5 h-5'/>
              <span className='cg-text-lg-500'>Universal Profile</span>
              <Tooltip
                placement='top'
                triggerContent={<Info weight='duotone' className='w-4 h-4'/>}
                tooltipContent='The Universal Profile is a browser extension for digital identities and assets on the LUKSO blockchain'
              />
            </div>
          </div>
          {hasLuksoProfile && <Check className='w-8 h-8 cg-text-success' weight='duotone' />}
        </div>}

        {community.onboardingOptions.requirements.xProfileEnabled && <div className='flex p-4 gap-2 justify-between'>
          <div className={`flex flex-col gap-1 flex-1 ${hasXProfile ? ' opacity-50' : ''}`}>
            <span className='cg-text-lg-500'>Requires</span>
            <div className='flex items-center gap-2'>
              <ExternalIcon type='x' className='w-5 h-5'/>
              <span className='cg-text-lg-500'>X Profile</span>
            </div>
          </div>
          {hasXProfile && <Check className='w-8 h-8 cg-text-success' weight='duotone' />}
        </div>}

        {community.onboardingOptions.requirements.minAccountTimeEnabled && <div className='flex p-4 gap-2 justify-between'>
          <div className={`flex flex-col gap-1 flex-1 ${hasOldAcc ? ' opacity-50' : ''}`}>
            <span className='cg-text-lg-500'>Requires</span>
            <span className='cg-text-md-400'>
              <span>An account older than </span>
              {community.onboardingOptions.requirements.minAccountTimeDays === 30 ? 1 : community.onboardingOptions.requirements.minAccountTimeDays}
              {community.onboardingOptions.requirements.minAccountTimeDays === 30 && ' month'}
              {community.onboardingOptions.requirements.minAccountTimeDays === 1 ? ' day' : ' days'}
            </span>
          </div>
          {hasOldAcc && <Check className='w-8 h-8 cg-text-success' weight='duotone' />}
        </div>}
      </div>}
      <div className='flex flex-col justify-center px-4 gap-3 w-full'>
        <Button className='w-full' text='Join community' role='primary' onClick={onNext} loading={loading} disabled={btnDisabled} />
        <Button className='w-full' text='Close' role='secondary' onClick={onClose} />
      </div>
    </div>
  </ScreenAwareModal>);
}

export default CommunityRequirementsModal