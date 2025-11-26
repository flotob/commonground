// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';

import { useWindowSizeContext } from '../../../../context/WindowSizeProvider';
import { ChevronDownIcon, EyeIcon, EyeSlashIcon, GlobeEuropeAfricaIcon } from '@heroicons/react/20/solid';

import "./WalletVisibility.css";

const WalletVisibility: React.FC<{ visibility: string }> = ({ visibility }) => {
    const { isMobile} = useWindowSizeContext();

    const content = React.useMemo(() => {
        const renderContent = () => {
            if (visibility === 'public') {
                return <>
                    <GlobeEuropeAfricaIcon className='w-5 h-5' />
                    {!isMobile && <span className='connectedWalletsModal-subText'>Public</span>}
                    <ChevronDownIcon className='w-5 h-5' />
                </>
            } else if (visibility === 'followed') {
                return <>
                    <EyeIcon className='w-5 h-5' />
                    {!isMobile && <span className='connectedWalletsModal-subText'>Limited</span>}
                    <ChevronDownIcon className='w-5 h-5' />
                </>
            } else if (visibility === 'private') {
                return <>
                    <EyeSlashIcon className='w-5 h-5' />
                    {!isMobile && <span className='connectedWalletsModal-subText'>Hidden</span>}
                    <ChevronDownIcon className='w-5 h-5' />
                </>
            }

            return <>---</>
        }
        return renderContent();
    }, [isMobile, visibility]);

    return <div className='flex gap-2 items-center'>{content}</div>;
}

export default React.memo(WalletVisibility);