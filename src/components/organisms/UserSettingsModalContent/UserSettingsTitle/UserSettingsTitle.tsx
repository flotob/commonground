// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import React from 'react'

type Props = {
  title: string;
  goBack: () => void;
};

const UserSettingsTitle: React.FC<Props> = (props) => {
  return (<div className='flex py-3 px-4 gap-2 items-center w-full cg-text-main cursor-pointer' onClick={props.goBack}>
    <ChevronLeftIcon className='w-5 h-5' />
    <div className='flex items-center flex-1'>
      <span className='cg-heading-3 cg-text-main'>{props.title}</span>
    </div>
  </div>);
}

export default React.memo(UserSettingsTitle);