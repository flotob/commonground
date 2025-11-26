// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import { getCommunityDisplayName } from '../../../util';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUrl } from 'common/util';
import { UsersThree } from '@phosphor-icons/react';

type Props = {
  type: 'ongoing' | 'finished';
  community: API.Community.getAirdropCommunities.Response[number];
}

const AirdropCard: React.FC<Props> = (props) => {
  const { community, type } = props;
  const navigate = useNavigate();
  const hasSlots = !!community.role.airdropConfig?.maximumUsers && community.airdropUserCount < community.role.airdropConfig.maximumUsers;

  return (<div key={community.community.id} className='flex flex-col gap-4 p-4 cg-bg-subtle cg-border-xl cursor-pointer' onClick={() => {
    navigate(getUrl({ type: 'community-lobby', community: community.community }));
  }}>
    <div className='flex items-center gap-2'>
      <CommunityPhoto community={community.community} size='small' noHover />
      <span className='cg-heading-3'>{getCommunityDisplayName(community.community)}</span>
    </div>
    <div className='flex flex-wrap items-center gap-x-1'>
      <span>For holders of the</span>
      <div className='p-1 cg-bg-subtle cg-border-l'>{community.role.title}</div>
      <span>role</span>
    </div>

    <div className='flex items-center justify-between gap-2 mt-auto'>
      {!community.userAirdropData && type === 'ongoing' && hasSlots && <div className='cg-text-brand cg-heading-4'>
        Get the airdrop while you can!
      </div>}

      {!community.userAirdropData && (type === 'finished' || !hasSlots) && <div className='cg-text-warning cg-text-lg-500'>
        You did not participate in this airdrop.
      </div>}

      {!!community.userAirdropData && <div className='flex flex-col gap-1'>
        <span className='cg-heading-4'>You are part of this airdrop.</span>
        <span className='cg-text-success cg-text-lg-500'>Reward: {Number(community.userAirdropData.amount).toLocaleString('en-US', { maximumFractionDigits: 2 })} $CG</span>
      </div>}

      <div className='flex items-center gap-1 self-end p-2 cg-bg-subtle cg-border-l'>
        <span>{community.airdropUserCount}{community.role.airdropConfig?.maximumUsers ? <span className='cg-text-secondary'>/{community.role.airdropConfig.maximumUsers}</span> : ''}</span>
        <UsersThree weight='duotone' className='w-5 h-5 cg-text-secondary'/>
      </div>
    </div>
  </div>);
}

export default AirdropCard