// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './StatusIndicator.css';
import config from 'common/config';
import React from 'react';

type Props = {
  status: Models.User.OnlineStatus;
};

const StatusIndicator: React.FC<Props> = (props) => {
  const { status } = props;
  return (<div className="status-container">
    <svg width="100%" viewBox="0 0 42 42">
      <circle fill={config.STATUS_COLORS[status]} r={18} cx={21} cy={21} strokeWidth='1px' className='jdenticon-status-circle' vectorEffect='non-scaling-stroke' />
    </svg>
  </div>);
}

export default React.memo(StatusIndicator);