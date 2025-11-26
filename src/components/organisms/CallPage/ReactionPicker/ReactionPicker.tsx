// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallContext } from 'context/CallProvider';
import './ReactionPicker.css';
import React, { useCallback, useRef } from 'react'
import { useWindowSizeContext } from 'context/WindowSizeProvider';

type Props = {
  showPicker: boolean;
  closePicker: () => void;
}

const REACTION_THROTTLE_MS = 250;
const MAX_QUEUE_SIZE = 8;
const reactions = ["🔥", "👍", "👏", "👋", "😂", "😭"];

const ReactionPicker: React.FC<Props> = (props) => {
  const { isMobile } = useWindowSizeContext();
  const { showPicker, closePicker } = props
  const { roomClient, me } = useCallContext();
  const reactionQueue = useRef<string[]>([]);
  const sendingReactions = useRef<boolean>(false);

  const sendReactions = useCallback(() => {
    const [firstReaction, ...queuedReactions] = reactionQueue.current;
    if (firstReaction) {
      roomClient?.sendReaction(me.id, firstReaction);
      reactionQueue.current = queuedReactions;
      setTimeout(sendReactions, REACTION_THROTTLE_MS);
    } else {
      sendingReactions.current = false;
    }
  }, [me.id, roomClient]);

  const queueReaction = useCallback((reaction: string) => {
    reactionQueue.current = [...reactionQueue.current.slice(0, MAX_QUEUE_SIZE - 1), reaction];
    if (!sendingReactions.current) {
      sendingReactions.current = true;
      sendReactions();
    }
  }, [sendReactions]);

  const className = [
    'reaction-picker flex cg-border-l absolute py-2 px-4 gap-4 self-center',
    isMobile ? 'top-4' : 'bottom-4',
    showPicker ? 'showing' : 'hidden'
  ].join(' ');

  return (<div className={className} onMouseLeave={closePicker}>
    {reactions.map(reac => <div
      key={reac}
      className='cg-heading-1 cursor-pointer'
      onClick={() => queueReaction(reac)}
    >{reac}</div>)}
  </div>);
}

export default React.memo(ReactionPicker);