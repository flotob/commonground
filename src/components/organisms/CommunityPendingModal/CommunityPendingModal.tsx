// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './CommunityPendingModal.css';
import React from 'react';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import Button from 'components/atoms/Button/Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import { useWindowSizeContext } from 'context/WindowSizeProvider';

type Props = {
  community: Models.Community.DetailView;
  onClose: () => void;
};

const CommunityPendingModal: React.FC<Props> = ({ community, onClose }) => {
  const { isMobile } = useWindowSizeContext();

  return (<ScreenAwareModal
    customClassname='community-pending-modal relative'
    isOpen={true}
    onClose={onClose}
    hideHeader
    noDefaultScrollable
    modalRootStyle={{ zIndex: 10101 }}
  >
    {!isMobile && <Button
      className='absolute top-4 right-4 cg-circular z-10'
      role='secondary'
      iconLeft={<XMarkIcon className='w-6 h-6' />}
      onClick={onClose}
    />}
    <div className='flex flex-col justify-center items-center gap-2 flex-1 self-stretch'>
      <div className='flex flex-col items-center justify-center gap-2 flex-1 self-stretch'>
        <div className='p-12'>
          <CommunityPhoto community={community} size='large' noHover />
        </div>
        <span className='cg-heading-3 cg-text-main text-center'>You've applied to join {community.title}</span>
        <span className='cg-text-lg-500 cg-text-main'>We will let you know if you are admitted.</span>
      </div>
      <div className='flex justify-center py-8 px-4 w-full'>
        <Button className='w-full' text='Got it' role='primary' onClick={onClose} />
      </div>
    </div>
  </ScreenAwareModal>);
}

export default CommunityPendingModal