// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './NotificationBanner.css';
import { BellIcon } from '@heroicons/react/20/solid';
import Button from 'components/atoms/Button/Button';
import React, { useState } from 'react';
import { useNotificationContext } from 'context/NotificationProvider';

type Props = {
  showPreview?: boolean;
}

const NotificationBanner: React.FC<Props> = (props) => {
  const [ hidden, setHidden ] = useState<boolean>(false);
  const { subscription, subscribeWebPush } = useNotificationContext();

  // explicitly compare subscription to null, because
  // only null means the subscription feature is available
  // but not enabled
  if (hidden || subscription !== null) {
    return null;
  }

  return (
    <div className='notification-banner'>
      <span className='cg-text-main cg-heading-5'>Never miss a message with push notifications</span>
      <div className='flex gap-2 flex-wrap-reverse'>
        <Button role='secondary' text='Not now' onClick={() => setHidden(true)}/>
        <Button role='primary' text='Enable notifications' onClick={() => subscribeWebPush?.()} iconLeft={<BellIcon className='w-5 h-5' />} />
      </div>
    </div>
  );
}

export default React.memo(NotificationBanner);