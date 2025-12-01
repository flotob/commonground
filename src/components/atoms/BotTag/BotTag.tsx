// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from "react";
import Jdenticon from "../Jdenticon/Jdenticon";
import BotBadge from "../BotBadge/BotBadge";

import './BotTag.css';

export type BotTagData = {
  id: string;
  name: string;
  displayName: string;
  avatarId: string | null;
  description?: string | null;
};

type Props = {
  bot: BotTagData;
  jdenticonSize?: '40' | '32' | '24' | '20';
  largeNameFont?: boolean;
  nameClassname?: string;
  noBg?: boolean;
};

function BotTag(props: Props) {
  const { bot, jdenticonSize, largeNameFont, nameClassname, noBg } = props;

  return (
    <div className={`bot-tag${noBg ? ' no-bg' : ''}`}>
      <Jdenticon 
        userId={bot.id} 
        defaultImageId={bot.avatarId}
        hideStatus
        predefinedSize={jdenticonSize || '40'} 
      />
      <div className="bot-tag-info">
        <span className={`bot-tag-name ${nameClassname || (largeNameFont ? 'cg-text-main cg-text-lg-500' : 'cg-text-main cg-text-sm-500')}`}>
          {bot.displayName}
        </span>
        <BotBadge />
      </div>
    </div>
  );
}

export default React.memo(BotTag);

