// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';

type Props = {

};

const WizardShareLink: React.FC<Props> = (props) => {
  return (<div className='flex flex-col gap-2 items-center'>
    <h2>Here's your link</h2>
    <div className='cg-bg-subtle cg-text-lg-500 p-2 select-text whitespace-nowrap overflow-hidden max-w-full text-ellipsis'>{window.location.href}</div>
    <h2 className='text-center'>Send it to someone who you think wants to invest in this</h2>
  </div>);
}

export default React.memo(WizardShareLink);