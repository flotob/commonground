// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useRef, useState } from 'react'
import './EcosystemPicker.css';
import { ReactComponent as FuelIcon } from 'components/atoms/icons/24/Fuel.svg';
import { ReactComponent as LuksoIcon } from 'components/atoms/icons/24/Lukso.svg';
import { ReactComponent as CircleLogo } from "components/atoms/icons/misc/Logo/logo.svg";
import { ArrowRightIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { EcosystemType, ecosystems, useEcosystemContext } from 'context/EcosystemProvider';
import { useNavigate } from 'react-router-dom';
import { getUrl } from 'common/util';
import ScreenAwarePopover from 'components/atoms/ScreenAwarePopover/ScreenAwarePopover';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { PopoverHandle, Tooltip } from 'components/atoms/Tooltip/Tooltip';
import PowershiftIcon from 'components/atoms/icons/externals/powershift.png';
import Si3Icon from 'components/atoms/icons/externals/si3.webp';
import { SimpleChannel, channelNameMap } from 'components/organisms/EcosystemMenu/EcosystemMenu';
import { ReactComponent as CscIcon } from 'components/atoms/icons/externals/csc.svg';
import { ShieldChevron } from '@phosphor-icons/react';

type Props = {
  expanded?: boolean;
}

export function getEcosystemName(value: EcosystemType | 'cg' | SimpleChannel | null) {
  const ecosystemName = getEcosystemNameString(value);
  return <span className='flex gap-0.5 items-center'>
    {ecosystemName}
    {ecosystems.includes(value as any) && <>
      {' '}
      <Tooltip
        placement='top'
        allowPropagation
        triggerClassName='inline-flex'
        triggerContent={<ShieldChevron weight='duotone' className='w-4 h-4 cg-text-brand' />}
        tooltipContent='Partner channel'
        offset={4}
      />
    </>}
  </span>;
}

export function getEcosystemNameString(value: EcosystemType | 'cg' | SimpleChannel | null) {
  if (!value) return 'Common Ground';

  switch (value) {
    case 'fuel': return 'Fuel';
    case 'lukso': return 'LUKSO';
    case 'powershift': return 'PowerShift™️ Nation';
    case 'cannabis-social-clubs': return 'CSC Ecosystem 🇩🇪';
    case 'si3': return 'Si3';
    case 'cg': return 'Common Ground';
    default: return channelNameMap[value];
  }
}

export function getFullEcosystemName(value: EcosystemType | 'cg' | null) {
  switch (value) {
    case 'cannabis-social-clubs': return 'Cannabis Social Clubs';
    default: return getEcosystemName(value);
  }
}

export function getEcosystemIcon(value: EcosystemType | 'cg' | null, sizeRem: number = 5) {
  const className = `w-${sizeRem} h-${sizeRem}`;
  switch (value) {
    case 'fuel': return <FuelIcon className={className} />;
    case 'lukso': return <LuksoIcon className={className} />;
    case 'powershift': return <img src={PowershiftIcon} className={className + ' p-0.5 ecosystem-icon-dark-bg cg-circular object-contain'} alt='powershift' />;
    case 'cannabis-social-clubs': return <CscIcon className={className} />;
    case 'si3': return <img src={Si3Icon} className={className + ' object-contain'} alt='Si3' />;
    default: return <CircleLogo className={className} />;
  }
}

export function getEcosystemDescription(value: EcosystemType | null) {
  switch (value) {
    case 'fuel': return "Ecosystem for the World's Fastest Modular Execution Layer";
    case 'lukso': return 'Explore the Ecosystem for the New Creative Economies';
    case 'powershift': return 'The Future is Decentralized: Embrace the PowerShift™️';
    case 'cannabis-social-clubs': return 'Das Ökosystem für alle Anbauvereine';
    case 'si3': return 'Discover the Ecosystem Powered by Womxn & Non-Binary Leaders';
    default: return 'All-purpose Ecosystem for all communities on Common Ground';
  }
}

const EcosystemPicker: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const { ecosystem } = useEcosystemContext();
  const { isMobile, isTablet } = useWindowSizeContext();
  const popoverRef = useRef<PopoverHandle>(null);

  const onEcosystemPick = useCallback((ecosystem: EcosystemType | null) => {
    navigate(getUrl({ type: 'home' }));
    popoverRef.current?.close();
  }, [navigate]);

  const tooltipContent = <>
    <span className='cg-heading-3 cg-text-main self-stretch px-4'>Ecosystems</span>
    {ecosystems.map(type => (
      <div className='ecosystem-toggle cg-text-main' key={type || 'cg'} onClick={() => onEcosystemPick(type)}>
        <div className='flex flex-col gap-2 self-stretch flex-1'>
          <div className='flex flex-1 gap-2'>
            {getEcosystemIcon(type)}
            <span>{getEcosystemName(type)}</span>
          </div>
          <span className='cg-text-secondary cg-text-md-400'>
            {getEcosystemDescription(type)}
          </span>
        </div>
        <ArrowRightIcon className='arrow w-5 h-5' />
      </div>
    ))}
  </>;

  if (isTablet) {
    return (<ScreenAwarePopover
      ref={popoverRef}
      triggerType='click'
      closeOn='toggleOrClick'
      triggerClassName={`ecosystem-picker-container`}
      triggerContent={<div className={`ecosystem-picker${active ? ' active' : ''}`}>
        {getEcosystemIcon(ecosystem, 7)}
        <ChevronUpDownIcon className='w-5 h-5 ecosystem-picker-arrow cg-text-secondary' />
      </div>}
      tooltipClassName='ecosystem-tooltip'
      tooltipContent={tooltipContent}
      placement='bottom-start'
      onOpen={() => setActive(true)}
      onClose={() => setActive(false)}
    />);
  }

  if (!props.expanded) {
    return <div className={`ecosystem-picker-container justify-center home-btn`} onClick={() => navigate(getUrl({ type: 'home' }))}>
      <div className='ecosystem-picker'>
        {getEcosystemIcon(ecosystem, 7)}
      </div>
    </div>
  }

  return (<ScreenAwarePopover
    ref={popoverRef}
    triggerType='click'
    closeOn='toggleOrClick'
    triggerClassName={`ecosystem-picker-container`}
    triggerContent={<div className={`ecosystem-picker${active ? ' active' : ''}`}>
      <div className='pr-2'>{getEcosystemIcon(ecosystem, 7)}</div>
      <span className={isMobile ? 'cg-heading-2' : 'cg-text-md-400'}>{getEcosystemName(ecosystem)}</span>
      <ChevronUpDownIcon className='w-5 h-5 ecosystem-picker-arrow cg-text-secondary' />
    </div>}
    tooltipClassName={!isMobile ? 'ecosystem-tooltip' : undefined}
    tooltipContent={tooltipContent}
    placement='bottom-start'
    onOpen={() => setActive(true)}
    onClose={() => setActive(false)}
  />);
}

export default React.memo(EcosystemPicker);