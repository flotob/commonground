// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react'
import OnboardingLogo from '../OnboardingLogo';
import ToggleText from 'components/molecules/ToggleText/ToggleText';
import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/20/solid';
import Button from 'components/atoms/Button/Button';
import { useNotificationContext } from 'context/NotificationProvider';

type Props = {
  onProceed: () => void;
};

const EnablePush: React.FC<Props> = (props) => {
  const { onProceed } = props;
  const [isActive, setIsActive] = useState(true);
  const { subscription, subscribeWebPush } = useNotificationContext();

  // // explicitly compare subscription to null, because
  // // only null means the subscription feature is available.
  // // but not enabled
  // if (subscription !== null) {
  //   // If the feature is not available, we can skip this step
  //   props.onProceed();
  // }

  const onClickNext = () => {
    if (isActive) subscribeWebPush?.();
    onProceed();
  }

  return (<div className='flex flex-col py-8 px-4 items-center justify-between min-h-full gap-6'>
    <div className='flex flex-col items-center justify-center gap-2'>
      <OnboardingLogo />
      <span className='cg-heading-3 w-72'>Never miss a message with Push Notifications</span>
    </div>
    <div className='flex-1 flex flex-col gap-2 items-center w-full'>
      <ToggleText
        title='Enable notifications (recommended)'
        icon={<BellAlertIcon className='w-5 h-5 cg-text-main' />}
        description='Get notifications from your communities'
        active={isActive}
        onToggle={() => setIsActive(true)}
      />
      <ToggleText
        title='Disable all notifications'
        icon={<BellSlashIcon className='w-5 h-5 cg-text-secondary' />}
        description='You may miss important updates'
        active={!isActive}
        onToggle={() => setIsActive(false)}
      />
    </div>
    <div className='flex flex-col gap-2 items-center max-w-xs w-full'>
      <span className='cg-text-lg-500'>We will ask you for permissions to send push notifications 🥳</span>
      <Button
        text='Next'
        className='w-full'
        role='primary'
        onClick={onClickNext}
      />
    </div>
  </div>);
}

export default EnablePush