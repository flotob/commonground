// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Tooltip } from 'components/atoms/Tooltip/Tooltip';
import React from 'react'
import { GatedStatus } from './EventCart.helper';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/20/solid';

type Props = {
  gatedState: GatedStatus;
};

const EventExclusiveTooltip: React.FC<Props> = (props) => {
  const { gatedState } = props;
  if (!gatedState) return null;

  const tooltipContent = <div>
    You can {gatedState?.type === 'preview' ? 'preview' : 'attend'} because you have the following role(s):
    <ul style={{ listStyleType: 'disc' }} className="ml-6 mt-1">
      {gatedState?.roles.map(role => (
        <li key={role.roleId}>{role.roleTitle}</li>
      ))}
    </ul>
  </div>;

  return (
    <Tooltip
      placement='top'
      triggerContent={<div className='flex items-center gap-1 cg-text-main cg-text-md-400'>
        {gatedState.type === 'preview' ? <LockClosedIcon className='w-3 h-3' /> : <LockOpenIcon className='w-3 h-3' />}
        <span>{gatedState.type === 'preview' ? 'Preview only' : 'Exclusive'}</span>
      </div>
      }
      triggerClassName={`flex gap-1`}
      tooltipContent={tooltipContent}
    />
  )
}

export default React.memo(EventExclusiveTooltip);