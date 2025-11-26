// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './CommunityContentSkeletonCard.css';

type Props = { featured?: boolean };

const CommunityContentSkeletonCard: React.FC<Props> = ({ featured }) => {

  function randomInt(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  return (
    <div className={`community-content-skeleton-card${featured ? '' : ' collapsed'}`}>
      <div className='community-photo-container skeleton-box' />
      <div className='community-card-footer'>
        <span className='skeleton-placeholder-item'>
          {Array.from(Array(randomInt(3, 4)).keys()).map(wordNum => <span
            key={wordNum}
            className='skeleton-placeholder-word skeleton-box'
            style={{ width: `${randomInt(15, 20)}%` }}
          />)}
        </span>
      </div>
    </div>
  )
}

export default React.memo(CommunityContentSkeletonCard);