// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo, useRef } from "react";

import ReactionEmojiItem from "../../../../components/atoms/ReactionEmojiItem/ReactionEmojiItem";

import "./ReactionsDisplay.css";

const TRANSITION_DURATION_MS = 150;
const transition = `height ${TRANSITION_DURATION_MS / 1000}s`;

export default function ReactionsDisplay(props: {
    message: Models.Message.Message;
    setReaction: (reaction: string) => void;
    unsetReaction: () => void;
}) {
  const { message, setReaction, unsetReaction } = props;
  const { reactions } = message;
  const divRef = useRef<HTMLDivElement>(null);
  
  const show = useMemo(() => {
    return !!reactions ? Object.entries(reactions).length > 0 : false;
  }, [!!reactions && Object.entries(reactions).length > 0]);
  const initialRenderRef = useRef<boolean>(show);
  const initiallyVisible = initialRenderRef.current;

  const style = useMemo(() => {
    const style: React.CSSProperties = { transition };
    if (show) {
      style.height = '28px';
    }
    if (initialRenderRef.current) {
      style.minHeight = show ? '28px' : undefined;
      initialRenderRef.current = false;
    }
    return style;
  }, [show]);

  return (
    <div className="reactions-display" ref={divRef} style={style}>
      {show === true ? (
        Object.entries(reactions).map(([reaction, count]) => (
          <ReactionEmojiItem
            key={reaction}
            reaction={reaction}
            count={count}
            hasReacted={reaction === message.ownReaction}
            transitionDuration={TRANSITION_DURATION_MS}
            setReaction={setReaction}
            unsetReaction={unsetReaction}
            initiallyVisible={initiallyVisible}
          />
        ))) : undefined}
    </div>
  );
}