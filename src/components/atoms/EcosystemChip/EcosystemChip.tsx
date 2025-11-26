// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './EcosystemChip.css';
import { XMarkIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { getEcosystemName } from 'components/molecules/EcosystemPicker/EcosystemPicker';
import { HomeChannelTypes } from 'views/Home/Home';

type Props = {
  channel: HomeChannelTypes | null;
  text?: string;
  iconLeft?: JSX.Element;
  iconRight?: JSX.Element;
  selected: boolean;
  onClick?: () => void;
  showRemoveIcon?: boolean;
};

const EcosystemChip: React.FC<Props> = (props) => {
  const { channel, text, iconLeft, iconRight, selected, showRemoveIcon, onClick } = props;

  const className = [
    'ecosystem-chip flex gap-1 py-1 px-3 items-center justify-center h-9 cursor-pointer cg-text-md-400',
    selected ? 'selected' : ''
  ].join(' ').trim();

  return (<div className={className} onClick={onClick}>
    {iconLeft}
    {!!text ? text : getEcosystemName(channel as any)}
    {showRemoveIcon && <XMarkIcon className='w-4 h-4'/>}
    {iconRight}
  </div>);
}

export default React.memo(EcosystemChip);