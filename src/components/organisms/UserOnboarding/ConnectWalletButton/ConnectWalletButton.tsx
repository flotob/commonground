// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { WalletIcon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getDomain, getTypes } from 'common/templates';
import Button from 'components/atoms/Button/Button';
import Tag from 'components/atoms/Tag/Tag';
import userApi from 'data/api/user';
import React, { useCallback, useState } from 'react'
import { useSignMessage, useAccount, useChainId } from "wagmi";

import './ConnectWalletButton.css';
import getSiweMessage from 'util/siwe';

type Props = {
  walletData: API.User.prepareWalletAction.Request | undefined;
  setWalletData: React.Dispatch<React.SetStateAction<API.User.prepareWalletAction.Request | undefined>>;
};

const ConnectWalletButton: React.FC<Props> = (props) => {
  const { walletData, setWalletData } = props;

  const { address } = useAccount();
  const chainId = useChainId();
  const domain = getDomain(chainId);
  const types = getTypes();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState<string | undefined>();

  const linkCurrentWallet = useCallback(async () => {
    if (!!address) {
      try {
        const secret = await userApi.getSignableSecret();
        const siweMessage = getSiweMessage({ address, secret, chainId });
        const signature = await signMessageAsync({ message: siweMessage });
        const data: API.User.SignableWalletData = {
          address: address.toLowerCase() as Common.Address,
          siweMessage,
          secret,
          type: "evm",
        };

        setWalletData({ type: 'evm', data, signature });
        setError(undefined);
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace('Error:', '');
        }
        setError(message);
      }
    }
  }, [address, chainId, signMessageAsync, domain, types, setWalletData]);

  return <ConnectButton.Custom>
    {({
      account,
      chain,
      openAccountModal,
      openChainModal,
      openConnectModal,
      mounted,
      accountModalOpen,
      chainModalOpen,
      connectModalOpen
    }) => {
      const connected = mounted && account && chain;

      return (
        <>
          {(() => {
            if (!connected) {
              return (<Button
                role='secondary'
                className='justify-between'
                text='Connect wallet'
                iconRight={<WalletIcon className='w-5 h-5' />}
                onClick={openConnectModal}
              />);
            }

            if (chain.unsupported) {
              return (
                <Button role="primary" text="Wrong network" onClick={openChainModal} />
              );
            }

            return (<div className='flex flex-col gap-2'>
              <div className='connect-wallet-connected-container'>
                <Tag variant="wallet" label={account.displayName.toLowerCase()} />

                {!walletData && <Button
                  text='Please sign to activate'
                  role='secondary'
                  onClick={linkCurrentWallet}
                />}
                {!!walletData && <div className='flex items-center gap-4'>
                  <Tag variant='success' label='Active' />
                  <XMarkIcon className='w-6 h-6 cursor-pointer' onClick={() => setWalletData(undefined)} />
                </div>}
              </div>
              {error && <span className='error cg-text-md-400'>{error}</span>}
              <span className='cg-text-secondary cg-text-md-400'>Your wallet is not shown to others. You can change this in your settings.</span>
            </div>
            );
          })()}
        </>
      );
    }}
  </ConnectButton.Custom>
}

export default React.memo(ConnectWalletButton);