// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import dayjs from 'dayjs';
import React from 'react'

import './Timestamp.css';

type TimestampMode = 'hour' | 'date' | 'minimal' | 'dateHour';

type Props = {
  timestamp: string | Date;
  mode: TimestampMode;
  className?: string;
};

function generateTimeString(timestamp: string | Date, mode: TimestampMode) {
  const time = dayjs(timestamp);

  switch (mode) {
    case 'hour':
      return time.format("HH:mm");
    case 'date':
      return time.format(('MMM DD'));
    case 'minimal':
      if (time.isToday()) {
        return time.format("HH:mm");
      } else {
        return time.format(('MMM DD'));
      }
    case 'dateHour':
      return time.format(('MMM DD, HH:mm'));
    default:
      return '';
  }
}

const Timestamp: React.FC<Props> = (props) => {
  const lastUpdate = generateTimeString(props.timestamp, props.mode);
  const className = ['timestamp', props.className].join(' ').trim();

  return (
    <span className={className}>{lastUpdate}</span>
  )
}

export default React.memo(Timestamp);