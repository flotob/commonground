// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './DateTimeField.css';
import dayjs from 'dayjs';
import React, { useRef } from 'react';

type Props = {
  value: dayjs.Dayjs;
  onChange: (value: dayjs.Dayjs) => void;
  minValueNow?: boolean;
  minValue?: dayjs.Dayjs;
  step?: number;
}

function toInputDate(dayjs: dayjs.Dayjs) {
  return dayjs.format('YYYY-MM-DDTHH:mm');
}

const DateTimeField: React.FC<Props> = (props) => {
  const { value, onChange, minValueNow, minValue, step } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  return <input
    className='date-time-field'
    ref={inputRef}
    type='datetime-local'
    value={toInputDate(value)}
    min={minValue ? toInputDate(minValue) : minValueNow ? toInputDate(dayjs()) : undefined}
    onChange={ev => {
      onChange(dayjs(ev.target.value));
    }}
    step={step}
  />
}

export default React.memo(DateTimeField);