// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState, useEffect } from 'react';
import './CallTimer.css';
import dayjs, { Dayjs } from 'dayjs';

interface TimerProps {
  startTime: Dayjs;
  className?: string;
  noBg?: boolean;
}

function getDurationString(startTime: Dayjs) {
  const diff = dayjs().diff(startTime, 'second');
  const seconds = diff % 60;
  const minutes = Math.floor(diff / 60) % 60;
  const hours = Math.floor(diff / 3600);

  return (
    (hours > 0 ? `${hours}:` : '') +
    (minutes > 9 ? `${minutes}:` : `0${minutes}:`) +
    (seconds > 9 ? `${seconds}` : `0${seconds}`)
  );
}

export const CallTimer: React.FC<TimerProps> = ({ startTime, className, noBg }) => {
  const [elapsedTime, setElapsedTime] = useState(getDurationString(startTime));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedTime(getDurationString(startTime));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return <div className={`call-timer cg-text-md-500 ${className}${noBg ? ' noBg' : ''}`}>{elapsedTime}</div>;
};