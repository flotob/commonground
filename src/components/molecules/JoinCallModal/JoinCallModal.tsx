// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo, useState } from 'react';
import './JoinCallModal.css';
import Button from 'components/atoms/Button/Button';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import { CallTimer } from 'components/organisms/CallPage/CallTimer';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { Dayjs } from 'dayjs';

type Props = {
  title: string;
  description: string | null;
  startTime: Dayjs;
  onStartCall: () => void;
  callMemberCount: number;
  callLimit: number;
};

const JoinCallModal: React.FC<Props> = (props) => {
  const {
    title,
    description,
    startTime,
    onStartCall,
    callMemberCount,
    callLimit
  } = props;
  const { isMobile, isTablet } = useWindowSizeContext();
  const [isOpen, setIsOpen] = useState(true);
  const isCallFull = callMemberCount >= callLimit;

  const content = useMemo(() => {
    return <div className='flex flex-col gap-4'>
      <div className='flex'>
        <CallTimer startTime={startTime} />
      </div>
      <span className='cg-heading-2'>{title}</span>
      <span className={`cg-text-md-500 ${isCallFull ? "cg-text-warning" : "cg-text-secondary"}`}>{`In Call (${callMemberCount}/${callLimit}) ${isCallFull ? 'Full' : ''}`}</span>
      {description && <div className='flex flex-col'>
        <span className='cg-text-md-500 cg-text-secondary'>Agenda</span>
        <span className='cg-text-lg-500 cg-text-main'>{description}</span>
      </div>}
      <Button
        className='w-full'
        role='primary'
        text={isCallFull ? 'This call is full' : 'Join call'}
        onClick={onStartCall}
        disabled={isCallFull}
      />
    </div>;
  }, [isCallFull, callLimit, callMemberCount, description, onStartCall, startTime, title]);

  if (!isMobile && !isTablet) {
    return <div className='join-call-modal-desktop absolute p-16'>
      {content}
    </div>
  } else {
    return <ScreenAwareModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <div className='px-4 cg-text-main'>
        {content}
      </div>
    </ScreenAwareModal>
  }
}

export default React.memo(JoinCallModal);