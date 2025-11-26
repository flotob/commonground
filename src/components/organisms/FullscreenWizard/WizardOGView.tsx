// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import React, { useCallback } from 'react';
import florianJpg from './WizardOGImgs/florian.jpg';
import Scrollable from 'components/molecules/Scrollable/Scrollable';

type Props = {
  action: Models.Wizard.WizardAction;
  onNext: () => void;
};

type OG = {
  imgSrc: string;
  name: string;
  description: string;
};

const OGs: OG[] = [
  {
    imgSrc: florianJpg,
    name: 'Florian Glatz',
    description: 'Founder, Common Ground'
  },
];

const WizardOGView: React.FC<Props> = (props) => {
  const {
    action,
    onNext
  } = props;

  const onContinue = useCallback(() => {
    onNext();
  }, [onNext]);

  return (<div className='fullscreen-wizard-step flex flex-col gap-4'>
    <Scrollable alwaysVisible>
      <div className='flex flex-col items-center gap-4'>
        <h2 className='text-center mt-4'>Before we continue</h2>
        <h5 className='text-center'>Next, we are going to ask you for an NDA, and KYC. While we can’t share specifics until you have an NDA, feel free to touch base with our team/advisors before you proceed.</h5>
        <div className='flex flex-col my-4'>
          <h5 className='text-center'>Target check size: $50k</h5>
          <h5 className='text-center'>Min check size: $10k</h5>
        </div>
        <div className='grid grid-cols-2 gap-6 w-full'>
          {OGs.map((og, index) => (<div key={index} className='flex flex-col gap-1 items-center'>
            <img src={og.imgSrc} alt={og.name} className='cg-circular h-24 w-24 object-cover' />
            <span className='cg-text-lg-500'>{og.name}</span>
            {og.description && <span className='cg-text-secondary cg-text-md-400'>{og.description}</span>}
          </div>))}
        </div>
      </div>
    </Scrollable>
    <div className='flex flex-col gap-4'>
      {/* {!ownUser?.email && <TextInputField
        value={email}
        onChange={setEmail}
        placeholder='Enter your email to continue'
      />} */}
      <Button
        className='w-full'
        role={action.role}
        text={action.text}
        onClick={onContinue}
      />
    </div>
  </div>);
}

export default React.memo(WizardOGView);