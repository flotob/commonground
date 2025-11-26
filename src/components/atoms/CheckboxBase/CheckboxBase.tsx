// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from 'react';
import './CheckboxBase.css';
import { Check, Minus } from '@phosphor-icons/react';

type Props = {
  checked?: boolean;
  setChecked?: (checked: boolean) => void;
  type: 'checkbox' | 'checkminus' | 'radio' | 'radiocheck';
  size: 'large' | 'normal' | 'small' | 'small-20';
  disabled?: boolean;
}

const CheckboxBase = (props: Props) => {
  const { checked, type, size, setChecked, disabled } = props;

  const className = [
    'checkboxBase',
    (type === 'radio' || type === 'radiocheck') ? 'radio' : 'box',
    size,
    `${checked ? ' checked' : ''}`,
    disabled ? 'disabled' : ''
  ].join(' ').trim();

  const content = useMemo(() => {
    if (!checked) return null;
    if (type === 'checkbox' || type === 'radiocheck') {
      return <Check weight='bold' className={size === 'large' ? 'w-8 h-8' : size === 'normal' ? 'w-6 h-6' : size === 'small-20' ? 'w-5 h-5' : 'w-4 h-4'}/>
    } else if (type === 'radio') {
      if (size === 'normal') {
        return CircleNormal;
      } else {
        return CircleSmall;
      }
    } else if (type === 'checkminus') {
      return <Minus weight='bold' className={size === 'large' ? 'w-8 h-8' : size === 'normal' ? 'w-6 h-6' : 'w-5 h-5'}/>
    }
  }, [checked, size, type]);

  return <div className={className} onClick={setChecked ? () => setChecked(!checked) : undefined}>
    {content}
  </div>
};

const CircleNormal = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="4.8" fill="currentColor" />
</svg>;

const CircleSmall = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="3" fill="currentColor" />
</svg>;

export default React.memo(CheckboxBase);