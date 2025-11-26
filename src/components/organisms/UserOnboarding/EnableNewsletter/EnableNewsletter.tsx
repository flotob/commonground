// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react'
import OnboardingLogo from '../OnboardingLogo';
import ToggleText from 'components/molecules/ToggleText/ToggleText';
import { EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/20/solid';
import Button from 'components/atoms/Button/Button';
import userApi from 'data/api/user';

type Props = {
  onProceed: () => void;
  userEmail?: string;
}

const EnableNewsletter: React.FC<Props> = (props) => {
  const { onProceed, userEmail } = props;
  const [isActive, setIsActive] = useState(true);

  // If no user email just go through
  if (!userEmail) {
    onProceed();
  }

  const onClickNext = () => {
    if (isActive && userEmail) {
      userApi.subscribeNewsletter({ email: userEmail });
    }
    onProceed();
  }

  return (<div className='flex flex-col py-8 px-4 items-center justify-between min-h-full gap-6'>
    <div className='flex flex-col items-center justify-center gap-2'>
      <OnboardingLogo />
      <span className='cg-heading-3 w-72'>Join the Newsletter</span>
    </div>
    <div className='flex-1 flex flex-col gap-2 items-center w-full'>
      <ToggleText
        title='Enable Newsletter'
        icon={<EnvelopeOpenIcon className='w-5 h-5 cg-text-main' />}
        description='Receive important updates community digests'
        active={isActive}
        onToggle={() => setIsActive(true)}
      />
      <ToggleText
        title='Disable Newsletter'
        icon={<EnvelopeIcon className='w-5 h-5 cg-text-main' />}
        description='You may miss important updates'
        active={!isActive}
        onToggle={() => setIsActive(false)}
      />
      <span className='cg-text-md-400 cg-text-secondary'>You can change this later</span>
    </div>
    <div className='flex flex-col gap-2 items-center max-w-xs w-full'>
      <Button
        text='Next'
        className='w-full'
        role='primary'
        onClick={onClickNext}
      />
    </div>
  </div>);
}

export default React.memo(EnableNewsletter);