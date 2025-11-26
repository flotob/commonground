// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import ExternalIcon from 'components/atoms/ExternalIcon/ExternalIcon';
import ToggleInputField from 'components/molecules/inputs/ToggleInputField/ToggleInputField';
import React, { useCallback } from 'react'

type Props = {
  requirements: NonNullable<Models.Community.OnboardingOptions['requirements']>;
  setRequirements: React.Dispatch<React.SetStateAction<NonNullable<Models.Community.OnboardingOptions['requirements']>>>;
};

const OnboardingRequirements: React.FC<Props> = (props) => {
  const { requirements, setRequirements } = props;
  const updateRequirement = useCallback((key: string, value: any) => {
    setRequirements(old => ({
      ...old,
      [key]: value
    }));
  }, [setRequirements]);

  return (<div className='flex flex-col gap-4'>
    <div className='flex flex-col gap-2'>
      <div className='flex justify-between gap-2 items-center'>
        <span className='cg-text-lg-500'>Account must be older than</span>
        <ToggleInputField
          toggled={requirements.minAccountTimeEnabled || false}
          onChange={() => updateRequirement('minAccountTimeEnabled', !requirements.minAccountTimeEnabled)}
        />
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          role='chip'
          text='1 day'
          active={requirements.minAccountTimeDays === 1}
          onClick={() => updateRequirement('minAccountTimeDays', 1)}
        />
        <Button
          role='chip'
          text='7 days'
          active={requirements.minAccountTimeDays === 7}
          onClick={() => updateRequirement('minAccountTimeDays', 7)}
        />
        <Button
          role='chip'
          text='1 month'
          active={requirements.minAccountTimeDays === 30}
          onClick={() => updateRequirement('minAccountTimeDays', 30)}
        />
      </div>
    </div>

    <div className='cg-separator' />

    <div className='flex justify-between gap-2 items-center'>
      <span className='flex items-center gap-1 cg-text-lg-500'>Must have <ExternalIcon type='lukso' className='w-5 h-5'/> Universal Profile</span>
      <ToggleInputField
        toggled={requirements.universalProfileEnabled || false}
        onChange={() => updateRequirement('universalProfileEnabled', !requirements.universalProfileEnabled)}
      />
    </div>

    <div className='cg-separator' />

    <div className='flex justify-between gap-2 items-center'>
      <span className='flex items-center gap-1 cg-text-lg-500'>Must have <ExternalIcon type='x' className='w-5 h-5'/> X (Formerly Twitter)</span>
      <ToggleInputField
        toggled={requirements.xProfileEnabled || false}
        onChange={() => updateRequirement('xProfileEnabled', !requirements.xProfileEnabled)}
      />
    </div>
  </div>);
}

export default React.memo(OnboardingRequirements);