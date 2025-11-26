// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useRef, useState } from 'react'
import Button from 'components/atoms/Button/Button';
import { useOwnWallets } from 'context/OwnDataProvider';
import { useSnackbarContext } from 'context/SnackbarContext';
import userApi from 'data/api/user';
import { PageType } from '../UserSettingsModalContent';
import BigWalletIcon from 'components/atoms/BigWalletIcon/BigWalletIcon';
import { useFuel } from 'context/FuelWalletProvider';

type Props = {
  setPage: (pageType: PageType) => void;
  setCurrentWallet: (walletId: string) => void;
  lockModal?: (lock: boolean) => void;
};

export type SignedState = 'unsigned' | 'signing' | 'signed' | 'cancelled';

const SignWalletFuelPage: React.FC<Props> = (props) => {
  const { setPage, setCurrentWallet } = props;
  const { showSnackbar } = useSnackbarContext();
  const wallets = useOwnWallets();
  const enableWalletRedirect = useRef(false);
  const [walletSignError, setWalletSignError] = useState<string>();
  const { linkCurrentWallet: linkFuelWallet, account, isConnected } = useFuel();

  const isActiveAddressLinked = useMemo(() => {
    return !!wallets?.find(wallet => wallet.walletIdentifier === account?.toLowerCase() && wallet.type === 'fuel');
  }, [account, wallets]);

  const linkCurrentWallet = useCallback(async () => {
    if (!isActiveAddressLinked && !!account) {
      try {
        const fuelResult = await linkFuelWallet();
        
        if (fuelResult) {
          const { data, signature } = fuelResult;
          await userApi.composed_addWallet({
            type: 'fuel',
            data,
            signature,
          }, {
            loginEnabled: true,
            visibility: 'private'
          });
          enableWalletRedirect.current = true;
          showSnackbar({ type: 'info', text: 'Wallet successfully signed' });
        }
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace('Error:', '');
        }
        setWalletSignError(message);
      }
    }
  }, [isActiveAddressLinked, account, linkFuelWallet, showSnackbar]);

  // Redirect to wallet page when wallet is connected
  if (enableWalletRedirect.current && isActiveAddressLinked) {
    const wallet = wallets?.find(wallet => wallet.walletIdentifier === account?.toLowerCase() && wallet.type === 'fuel');
    if (wallet) {
      enableWalletRedirect.current = false;
      setPage('wallet');
      setCurrentWallet(wallet.id);
    }
  }

  return (<div className="flex flex-col gap-4 px-4">
    <div className='flex flex-col gap-4 items-center justify-center'>
      <BigWalletIcon walletAddress={account || ''} />
      {isConnected && !isActiveAddressLinked && (<>
        <div className='flex flex-col items-center justify-center gap-2'>
          <span className='cg-heading-3 cg-text-main text-center'>Wallet Connected</span>
          <span className='cg-text-lg-400 cg-text-main text-center'>Please confirm ownership of this wallet</span>
        </div>
        <Button
          text='Confirm Ownership'
          className='w-full'
          role='primary'
          onClick={linkCurrentWallet}
        />
        {walletSignError && <span className='error cg-text-md-400'>{walletSignError}</span>}
      </>)}
      {isConnected && isActiveAddressLinked && (<>
        <div className='flex flex-col items-center justify-center gap-2'>
          <span className='cg-heading-3 cg-text-main text-center'>Wallet Already Signed</span>
          <span className='cg-text-lg-400 cg-text-main text-center'>Try connecting a different wallet on your wallet manager</span>
        </div>
      </>)}
    </div>
  </div>);
}

export default React.memo(SignWalletFuelPage);