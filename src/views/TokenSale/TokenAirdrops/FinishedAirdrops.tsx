// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useWindowSizeContext } from 'context/WindowSizeProvider';
import React from 'react'
import AirdropCard from './AirdropCard';

type Props = {
  communities: API.Community.getAirdropCommunities.Response;
}

const FinishedAirdrops: React.FC<Props> = (props) => {
  const { communities } = props;
  const { isMobile } = useWindowSizeContext();

  return (<>
    <div className='flex flex-col gap-2 items-center justify-center p-2 w-full'>
      <h2 className='text-center'>Finished Community Airdrops</h2>
    </div>
    <div className={`grid justify-between gap-4 cg-bg-subtle cg-border-xl p-4 w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {communities?.map((community) => (<AirdropCard
        community={community}
        key={community.community.id}
        type='finished'
      />))}
    </div >
  </>)
}

export default React.memo(FinishedAirdrops); 