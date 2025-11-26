// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useMemo, useState } from 'react';

import userApi from 'data/api/user';

import { useCopiedToClipboardContext } from '../../../context/CopiedToClipboardDialogContext';

import Button from '../../../components/atoms/Button/Button';
import Modal from '../../atoms/Modal/Modal';
import Tag from '../../../components/atoms/Tag/Tag';
import WalletRow from '../../../components/molecules/WalletRow/WalletRow';
import WalletSelectModal from './WalletSelectModal/WalletSelectModal';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSignMessage, useAccount, useChainId } from "wagmi";
import { useManagementContentModalContext } from '../ManagementContentModal/ManagementContentModalContext';

import './WalletsEditor.css';
import { useOwnWallets } from 'context/OwnDataProvider';
import { getDomain, getTypes } from 'common/templates';
import PaddedIcon from 'components/atoms/PaddedIcon/PaddedIcon';
import { KeyIcon, WalletIcon } from '@heroicons/react/20/solid';
import { useSnackbarContext } from 'context/SnackbarContext';
import getSiweMessage from 'util/siwe';

type Props = {
}

export type MetamaskSignedState = 'unsigned' | 'signing' | 'signed' | 'cancelled';

export default function WalletsEditor(props: Props) {
  const { triggerCopiedToClipboardDialog } = useCopiedToClipboardContext();
  const { setLockModalOpen } = useManagementContentModalContext();
  const { showSnackbar } = useSnackbarContext();
  const { address } = useAccount();
  const chainId = useChainId();
  const domain = getDomain(chainId);
  const types = getTypes();
  const { signMessageAsync } = useSignMessage();
  const wallets = useOwnWallets();

  const isActiveAddressLinked = useMemo(() => {
    return !!wallets?.find(wallet => wallet.walletIdentifier === address?.toLowerCase() && wallet.type === 'evm');
  }, [address, wallets]);

  const [currentWalletIsLinked, setCurrentWalletIsLinked] = useState<boolean>(isActiveAddressLinked);
  const [metamaskSignedState, setMetamaskSignedState] = useState<MetamaskSignedState>(isActiveAddressLinked ? 'signed' : 'unsigned');
  const [walletSignError, setWalletSignError] = useState<string>();
  const [showWalletSelectModal, setShowWalletSelectModal] = useState<boolean>(false);

  useEffect(() => {
    setCurrentWalletIsLinked(isActiveAddressLinked);
    setMetamaskSignedState(isActiveAddressLinked ? 'signed' : 'unsigned');
  }, [isActiveAddressLinked, address]);

  const onWalletConnect = useCallback(() => {
    showSnackbar({ type: 'info', text: 'Wallet connected' });
    setShowWalletSelectModal(false);
  }, [showSnackbar]);

  const linkCurrentWallet = useCallback(() => {
    if (!currentWalletIsLinked && !!address) {
      const sign = async () => {
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
          await userApi.composed_addWallet({
            type: 'evm',
            data,
            signature,
          }, {
            loginEnabled: false,
            visibility: 'private'
          });
          showSnackbar({ type: 'info', text: 'Wallet successfully signed' });
        } catch (e) {
          let message = (e as unknown as any).toString();
          if (message) {
            // remove useless prefix
            message = message.replace('Error:', '');
          }
          setWalletSignError(message);
          setMetamaskSignedState('cancelled');
        }
      }
      setMetamaskSignedState('signing');
      sign();
    }
  }, [currentWalletIsLinked, address, chainId, signMessageAsync, domain, types, showSnackbar]);

  return (
    <>
      <div className="wallets-editor wallet-settings-section">
        <ConnectButton.Custom>
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
            setLockModalOpen(chainModalOpen || connectModalOpen || accountModalOpen);

            const connected = mounted && account && chain;
            const connectedAddress = account?.address.toLocaleLowerCase();
            const notSigned = !!connectedAddress && wallets?.every(wallet => wallet.walletIdentifier !== connectedAddress);
            return (<>
              <div className="flex items-center gap-2 w-full">
                <PaddedIcon className='cg-text-success' icon={<WalletIcon className='w-5 h-5' />} />
                <span className='flex-1 cg-text-lg-500 cg-text-main'>Wallets</span>
                <>
                  {(() => {
                    if (!connected) {
                      return (<Button role="primary" text="Connect Wallet" onClick={openConnectModal} />);
                    }
                    if (chain.unsupported) {
                      return (<Button role="primary" text="Wrong network" onClick={openChainModal} />);
                    }
                  })()}
                </>
              </div>
              {connected && !chain.unsupported && notSigned && <div className='connected-wallet-container'>
                <div className='connected-wallet-row'>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tag variant="wallet" label={account.displayName.toLowerCase()} onClick={() => triggerCopiedToClipboardDialog(account.address.toLowerCase() as string)} />
                  </div>
                  <Button role="secondary" iconLeft={<KeyIcon className='w-5 h-5' />} text={isActiveAddressLinked ? "Already active" : "Sign to activate"} onClick={linkCurrentWallet} disabled={isActiveAddressLinked ? true : false} />
                </div>
              </div>}
              <div className='wallets-editor-content'>
                {wallets && wallets.length > 0 ? (
                  <div className='connected-wallets'>
                    {wallets.map(wallet => <WalletRow
                      wallet={wallet}
                      key={wallet.walletIdentifier}
                      connected={connectedAddress === wallet.walletIdentifier}
                    />)}
                  </div>
                ) : (
                  <div className="empty-wallets-row">
                    <WalletIcon className='w-5 h-5' />
                    <p>No active wallets</p>
                  </div>
                )}
              </div>
            </>);
          }}
        </ConnectButton.Custom>
      </div>
      {showWalletSelectModal && (
        <WalletSelectModal
          hideModal={() => setShowWalletSelectModal(false)}
          onWalletConnect={onWalletConnect}
        />
      )}
      {
        metamaskSignedState === 'signing' && (
          <Modal hideHeader modalInnerClassName="text-only-modal">
            <div className="wallet-connecting-modal">
              <Button loading role="borderless" className="connecting-btn" />
              <p>Signing...</p>
              <Button role="textual" text="Cancel" onClick={() => { setMetamaskSignedState('cancelled'); }} /> {/** FIXME THIS DOES NOT ACTUALLY CANCEL THE PROCESS IN METAMASK */}
            </div>
          </Modal>
        )
      }
      {
        metamaskSignedState === 'cancelled' && (
          <Modal hideHeader modalInnerClassName="text-only-modal">
            <div className="wallet-connecting-modal">
              <p>Wallet signing cancelled</p>
              <Button role="textual" text="OK" onClick={() => { setMetamaskSignedState('unsigned'); }} />
            </div>
          </Modal>
        )
      }
      {
        !!walletSignError && (
          <Modal hideHeader modalInnerClassName="text-only-modal">
            <div className="wallet-connecting-modal">
              <p>{walletSignError}</p>
              <Button role="textual" text="OK" onClick={() => { setWalletSignError(undefined) }} />
            </div>
          </Modal>
        )
      }
    </>
  );
}