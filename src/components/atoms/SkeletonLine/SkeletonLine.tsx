// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './SkeletonLine.css';

type Props = {
  minWidth: number;
  maxWidth: number;
};

function randomInt(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const SkeletonLine: React.FC<Props> = (props) => {
  const { minWidth, maxWidth } = props;
  return (
    <div className='skeleton-box skeleton-line' style={{ width: `${randomInt(minWidth, maxWidth)}px` }} />
  )
}

export default React.memo(SkeletonLine);