// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import { ClockIcon, MoonIcon, SunIcon } from '@heroicons/react/20/solid';
import { useDarkModeContext } from 'context/DarkModeProvider';
import CheckboxBase from 'components/atoms/CheckboxBase/CheckboxBase';
import UserSettingsButton from '../../../molecules/UserSettingsButton/UserSettingsButton';

type Props = {
};

const ThemePage: React.FC<Props> = (props) => {
  const { darkModeConfig, setDarkModeConfig } = useDarkModeContext();

  return (<div className='flex flex-col gap-2 px-4'>
    <span className='cg-text-lg-500 cg-text-main'>Select theme</span>
    <div className='flex flex-col gap-2 w-full'>
      <UserSettingsButton
        text='System auto'
        className='pr-2'
        leftElement={<ClockIcon className='w-5 h-5' />}
        rightElement={<CheckboxBase size='normal' type='radio' checked={darkModeConfig === 'auto'} />}
        onClick={() => setDarkModeConfig('auto')}
        active={darkModeConfig === 'auto'}
      />
      <UserSettingsButton
        text='Day'
        className='pr-2'
        leftElement={<SunIcon className='w-5 h-5' />}
        rightElement={<CheckboxBase size='normal' type='radio' checked={darkModeConfig === 'light'} />}
        onClick={() => setDarkModeConfig('light')}
        active={darkModeConfig === 'light'}
      />
      <UserSettingsButton
        text='Night'
        className='pr-2'
        leftElement={<MoonIcon className='w-5 h-5' />}
        rightElement={<CheckboxBase size='normal' type='radio' checked={darkModeConfig === 'dark'} />}
        onClick={() => setDarkModeConfig('dark')}
        active={darkModeConfig === 'dark'}
      />
    </div>
  </div>);
}

export default React.memo(ThemePage);