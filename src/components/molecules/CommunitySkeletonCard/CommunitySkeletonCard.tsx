// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import { useWindowSizeContext } from '../../../context/WindowSizeProvider';

import './CommunitySkeletonCard.css';

type Props = {};

const CommunitySkeletonCard: React.FC<Props> = () => {
  const { isMobile } = useWindowSizeContext();

  const content = (<div className='community-photo-container skeleton-box'></div>);

  if (isMobile) {
    return (
      <div className='community-skeleton-card-container'>
        {content}
      </div>
    )
  }

  return (
    <div className='community-skeleton-card-container'>
      {content}
    </div>
  )
}

export default React.memo(CommunitySkeletonCard);