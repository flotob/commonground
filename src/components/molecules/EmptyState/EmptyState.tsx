// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

import './EmptyState.css';

type Props = {
  title: string;
  description?: string;
}

const EmptyState: React.FC<Props> = ({ title, description }) => {
  return (
    <div className='flex flex-col p-4 gap-2 items-center justify-center'>
      <span className='cg-heading-1 cg-text-secondary text-center'>〰</span>
      <span className='cg-heading-3 cg-text-main text-center'>{title}</span>
      {description && <span className='cg-text-lg-400 cg-text-main text-center'>{description}</span>}
    </div>
  );
}

export default React.memo(EmptyState);