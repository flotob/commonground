// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import './BotBadge.css';

export interface BotBadgeProps {
  className?: string;
}

const BotBadge: React.FC<BotBadgeProps> = ({ className }) => {
  return (
    <span className={`bot-badge ${className || ''}`}>
      BOT
    </span>
  );
};

export default React.memo(BotBadge);

