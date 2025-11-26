// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './NotificationDot.css';

type Props = {
  className?: string;
}

const NotificationDot: React.FC<Props> = ({ className }) => {
  return (
    <div className={`notification-dot${className ? ` ${className}` : ''}`} />
  )
}

export default NotificationDot