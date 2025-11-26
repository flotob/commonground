// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import { useCreateCommunityModalContext } from '../../../context/CreateCommunityModalProvider';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

import './CreateCommunitySquareButton.css';

type Props = {
  text: string;
};

const CreateCommunitySquareButton: React.FC = () => {
  const { isVisible, setVisible } = useCreateCommunityModalContext();

  const className = [
    'create-community-square-button',
    isVisible ? 'active' : ''
  ].join(' ');

  return <div className={className} onClick={() => setVisible(true)}>
    <PlusCircleIcon className='w-6 h-6' />
  </div>
}

export const CreateCommunitySquareButtonText: React.FC<Props> = ({text}) => {
  const { isVisible, setVisible } = useCreateCommunityModalContext();

  const className = [
    'create-community-square-button-w-text',
    isVisible ? 'active' : ''
  ].join(' ');

  return <div className={className} onClick={() => setVisible(true)}>
    <div className='plus-icon'>
      <PlusCircleIcon className='w-6 h-6' />
    </div>
    <span>{text}</span>
  </div>
}

export default React.memo(CreateCommunitySquareButton);