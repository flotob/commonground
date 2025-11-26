// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from 'react'

import './MessageSkeletonPlaceholder.css';

function randomInt(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const MessageSkeletonPlaceholder = () => {
  const content = useMemo(() => {
    const numPosts = randomInt(1, 3);

    return (
      <div className="message-group">
        <div className='message-group-inner'>
          <div className='message-group-icon'>
            <div className='message-skeleton-placeholder-icon' />
          </div>
          <div className='message-group-content'>
            <div className='message-group-header message-skeleton-placeholder-header' style={{ width: `${randomInt(10, 25)}%` }} />
            <div className='message-container'>
              {Array.from(Array(numPosts).keys()).map(postNum => {
                const numPlaceholderWords = randomInt(1, 4);
                return <div className='message-item message-skeleton-placeholder-item' key={postNum}>
                  {Array.from(Array(numPlaceholderWords).keys()).map(wordNum => <div
                    key={wordNum}
                    className='message-skeleton-placeholder-word'
                    style={{ width: `${randomInt(20, 100)}px` }}
                  />)}
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);
  return content;
}

export default React.memo(MessageSkeletonPlaceholder);