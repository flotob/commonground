// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './Checkbox.css';

type Props = {
  checked: boolean;
  disabled?: boolean;
}

const Checkbox: React.FC<Props> = ({ checked, disabled = false }) => {
  return <input className='checkbox' type='checkbox' checked={checked} disabled={disabled} readOnly />
}

export default Checkbox