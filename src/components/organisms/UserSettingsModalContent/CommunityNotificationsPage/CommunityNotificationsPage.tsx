// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import Button from 'components/atoms/Button/Button';
import { useOwnCommunities } from 'context/OwnDataProvider';
import UserSettingsButton from '../../../molecules/UserSettingsButton/UserSettingsButton';
import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import ToggleInputField from 'components/molecules/inputs/ToggleInputField/ToggleInputField';

type Props = {
}

const CommunityNotificationsPage: React.FC<Props> = (props) => {
  const communities = useOwnCommunities();

  return (<div className='flex flex-col px-4 gap-4'>
    <div className='flex items-center justify-end self-stretch gap-1'>
      <Button
        role='chip'
        text='All on'
      />
      <Button
        role='chip'
        text='All off'
      />
    </div>
    <div className='flex flex-col gap-2'>
      {communities.map(community => <UserSettingsButton
        key={community.id}
        leftElement={<CommunityPhoto community={community} size="small" />}
        text={community.title}
        rightElement={<ToggleInputField toggled={false} />}
      />)}
    </div>
  </div>);
}

export default React.memo(CommunityNotificationsPage);