// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './DropdownHeader.css';

type Props = {
    title: string;
}

const DropdownHeader: React.FC<Props> = ({ title }) => {
  return (
    <div className="dropdown-title">{title}</div>
  )
}

export default React.memo(DropdownHeader);