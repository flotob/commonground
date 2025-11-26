// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useWindowSizeContext } from 'context/WindowSizeProvider';
import React from 'react';
import AirdropCard from './AirdropCard';

type Props = {
  communities: API.Community.getAirdropCommunities.Response;
}

const OngoingAirdrops: React.FC<Props> = (props) => {
  const { communities } = props;
  const { isMobile } = useWindowSizeContext();

  return (<>
    <div className='flex flex-col gap-4 items-center justify-center p-2 w-full'>
      <h2 className='text-center'>Ongoing Community Airdrops</h2>
    </div>
    {communities.length > 0 && <div className={`grid justify-between gap-2 cg-bg-subtle cg-border-xl p-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {communities?.map((community) => (<AirdropCard
        community={community}
        key={community.community.id}
        type='ongoing'
      />))}
    </div >}
    {communities.length === 0 && <div className='flex flex-col gap-2 items-center justify-center p-4 w-full cg-bg-subtle cg-border-xl'>
      <h3 className='text-center cg-text-secondary'>No ongoing airdrops</h3>
    </div>}
  </>)
}

export default React.memo(OngoingAirdrops); 