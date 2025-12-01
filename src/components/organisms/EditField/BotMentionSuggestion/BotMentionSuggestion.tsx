// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import './BotMentionSuggestion.css';
import Jdenticon from '../../../atoms/Jdenticon/Jdenticon';
import BotBadge from '../../../atoms/BotBadge/BotBadge';
import { insertBotMention, BotMentionElement } from '../EditField.helpers';
import { useSlate } from 'slate-react';
import { BaseRange } from 'slate';

type Props = {
  currentInput?: string;
  botData: BotMentionElement['botData'];
  mentionTargetRange: BaseRange;
  selected?: boolean;
}

const BotMentionSuggestion: React.FC<Props> = ({ currentInput = '', botData, mentionTargetRange, selected }) => {
  const editor = useSlate();
  const displayName = botData.displayName || botData.name;
  const className = selected ? 'botMentionSuggestion selected-mention' : 'botMentionSuggestion';

  const boldDisplayName = displayName.substring(0, currentInput.length);
  const remainingDisplayName = displayName.substring(boldDisplayName.length);

  const onClick = () => {
    // Delay to also allow for focusing on EditField
    setTimeout(() => insertBotMention(editor, mentionTargetRange, botData), 50);
  }

  return (<div className={className} onClick={onClick}>
      <div title={displayName}>
        <Jdenticon userId={botData.id} defaultImageId={botData.avatarId} hideStatus />
      </div>
      <div className="flex-grow">
        <span className='botMentionSuggestion-bold'>{boldDisplayName}</span>
        <span>{remainingDisplayName}</span>
      </div>
      <BotBadge />
    </div>)
}

export default React.memo(BotMentionSuggestion);

