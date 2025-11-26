// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { RECENT_REACTIONS_WINDOW_SECONDS, Reaction } from '../CallPage.reducer';
import './PeerReactionOverlay.css';
import React, { useRef, useState } from 'react';

type Props = {
  type: 'audience' | 'speaker' | 'mainSpeaker';
  reaction?: Reaction;
};

const PEER_REACTION_DURATION_SECONDS = RECENT_REACTIONS_WINDOW_SECONDS;

const PeerReactionOverlay: React.FC<Props> = (props) => {
  const { type, reaction } = props;
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const timeoutRef = useRef<any>(null);

  if (reaction && (reaction?.reaction !== lastReaction?.reaction || reaction?.reactionTime !== lastReaction?.reactionTime)) {
    setLastReaction(reaction);
    setShowReaction(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowReaction(false);
    }, PEER_REACTION_DURATION_SECONDS * 1000);
  }

  const className = [
    'peer-reaction-overlay',
    type,
    lastReaction ? (showReaction ? 'showing-reaction' : 'no-reaction') : '',
  ].join(' ').trim();

  return (<div className={className}>
    <div className='peer-reaction-popping' key={`${lastReaction?.reaction}-${lastReaction?.reactionTime}`}>
      {reaction?.reaction}
    </div>
  </div>);
}

export default React.memo(PeerReactionOverlay);