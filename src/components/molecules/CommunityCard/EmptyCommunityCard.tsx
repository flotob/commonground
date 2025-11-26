// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useWindowSizeContext } from 'context/WindowSizeProvider';
import React from 'react';

import './CommunityCard.css';

type Props = {
  onClick: () => void;
  title: string
}

export const EmptyCommunityCard: React.FC<Props> = (props) => {
  const { isMobile } = useWindowSizeContext();
  
  return (
    <div className={`society-card empty ${isMobile ? " mobile" : ""}`} onClick={props.onClick}>
      <div className='empty-image' />
      <div className="card-title">
        <span className='card-title-text'>{props.title}</span>
      </div>
    </div>
  );
}