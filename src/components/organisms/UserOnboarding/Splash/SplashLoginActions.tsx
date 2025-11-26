// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Button, { ButtonRole } from 'components/atoms/Button/Button';
import { ReactComponent as FuelIcon } from '../../../atoms/icons/24/Fuel.svg';
import { ReactComponent as FueletIcon } from '../../../atoms/icons/24/Fuelet.svg';
import { ReactComponent as AeternityIcon } from '../../../atoms/icons/24/Aeternity.svg';
import { ReactComponent as EthereumIcon } from '../../../atoms/icons/24/Ethereum.svg';
import { ReactComponent as LuksoIcon } from '../../../atoms/icons/24/Lukso.svg';
import { ReactComponent as FarcasterIcon } from '../../../atoms/icons/24/Farcaster.svg';
import { ReactComponent as MetamaskIcon } from '../../../atoms/icons/24/MetamaskIcon.svg';
import { ReactComponent as XIcon } from '../../../atoms/icons/24/X.svg';
import { EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/20/solid';
import { OnboardingStep } from 'context/UserOnboarding';
import { useTwitterAuth } from 'hooks/useTwitterAuth';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { useAeternityWallet } from 'context/AeternityWalletProvider';
import { useFuel } from 'context/FuelWalletProvider';
import { useUniversalProfile } from 'context/UniversalProfileProvider';
import { useAccount } from 'wagmi';

export type LoginButtonType =
  'x' |
  'metamask' |
  'eth' |
  'lukso' |
  'fuel' |
  'fuelet' |
  'aeternity' |
  'email' |
  'keyphrase' |
  'farcaster';

export type LoginOption =
  'rainbow' |
  'fuel' |
  'aeternity' |
  'universal-profile' |
  'email-password' |
  'keyphrase' |
  'farcaster';

type Props = {
  setLoginOption: (option: LoginOption) => void;
  attemptTwitterLogin: (data: API.Twitter.finishLogin.Response) => void;
  availableButtons: LoginButtonType[];
  warning?: string;
}

const SplashLoginActions: React.FC<Props> = (props) => {
  const { attemptTwitterLogin, setLoginOption, warning, availableButtons } = props;
  const { connectToWallet, isConnected: isAeternityConnected, hasWallet: hasAeternityWallet } = useAeternityWallet();
  const { connectToFuel, isConnected: isFuelConnected, hasWallet: hasFuelWallet, hasFuelet } = useFuel();
  const { attemptConnectTwitter, buttonDisabled: twitterButtonDisabled } = useTwitterAuth(attemptTwitterLogin);
  const { connectToUniversalProfile, hasExtension: hasUniversalProfileExtension, isConnected: isUniversalProfileConnected } = useUniversalProfile();
  const { address: ethAddress } = useAccount();

  const enableRainbowRedirect = useRef<boolean>(false);
  const enableFuelRedirect = useRef<boolean>(false);
  const enableAeternityRedirect = useRef<boolean>(false);
  const enableUniversalProfileRedirect = useRef<boolean>(false);

  useEffect(() => {
    // Move pages if rainbow connected
    if (enableRainbowRedirect.current && !!ethAddress) {
      enableRainbowRedirect.current = false;
      setLoginOption('rainbow');
    }

    // Move pages if fuel has connected
    if (enableFuelRedirect.current && isFuelConnected) {
      enableFuelRedirect.current = false;
      setLoginOption('fuel');
    }

    if (enableAeternityRedirect.current && isAeternityConnected) {
      enableAeternityRedirect.current = false;
      setLoginOption('aeternity');
    }
    
    if (enableUniversalProfileRedirect.current && isUniversalProfileConnected) {
      enableUniversalProfileRedirect.current = false;
      setLoginOption('universal-profile');
    }
  }, [ethAddress, isFuelConnected, isAeternityConnected, isUniversalProfileConnected, setLoginOption]);

  const renderButton = (buttonType: LoginButtonType, primary?: boolean) => {
    const role: ButtonRole = primary ? 'primary' : 'chip';
    switch (buttonType) {
      case 'x':
        return <Button
          key='x'
          className='splash-login-button'
          role={role}
          text={<>
            <XIcon className='w-5 h-5' /><br/>
            X
          </>}
          onClick={attemptConnectTwitter}
          disabled={twitterButtonDisabled}
        />;
      case 'email':
        return <Button
          key='email'
          className='splash-login-button'
          role={role}
          text={<>
            <EnvelopeIcon className='w-5 h-5' /><br/>
            Email address
          </>}
          onClick={() => setLoginOption('email-password')}
        />;
      case 'eth':
      case 'metamask':
        return <ConnectButton.Custom key={buttonType}>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
            accountModalOpen,
            chainModalOpen,
            connectModalOpen,
          }) => {
            // lockModal?.(chainModalOpen || connectModalOpen || accountModalOpen);
            const connected = mounted && account?.address && chain;

            const onClick = () => {
              if (!connected) {
                enableRainbowRedirect.current = true;
                openConnectModal();
              } else {
                setLoginOption('rainbow');
              }
            }

            const icon = buttonType === 'eth'
              ? <EthereumIcon className='w-5 h-5' />
              : <div className='flex'>
                <MetamaskIcon className='w-5 h-5' style={{ zIndex: 1 }} />
                <EthereumIcon className='w-5 h-5 -ml-1' />
              </div>

            return <Button
              key='eth'
              className='splash-login-button'
              role={role}
              text={<>
                {icon}<br/>
                Ethereum Wallet
              </>}
              onClick={onClick}
            />
          }}
        </ConnectButton.Custom>;
      case 'fuel':
        return <Button
          key='fuel'
          role={role}
          className='splash-login-button'
          text={<>
            <FuelIcon className='w-5 h-5' /><br/>
            Fuel Wallet
          </>}
          onClick={() => {
            if (!hasFuelWallet) {
              window.open('https://wallet.fuel.network/docs/install/', '_blank', 'noreferrer');
            } else if (!isFuelConnected) {
              enableFuelRedirect.current = true;
              connectToFuel();
            } else {
              setLoginOption('fuel');
            }
          }}
        />;
      case 'fuelet':
        return <Button
          key='fuelet'
          role={role}
          className='splash-login-button'
          text={<>
            <FueletIcon className='w-6 h-6 cg-text-main' /><br/>
            Fuelet Wallet
          </>}
          onClick={() => {
            if (!hasFuelWallet || !hasFuelet) {
              window.open('https://fuelet.app/', '_blank', 'noreferrer');
            } else if (!isFuelConnected) {
              enableFuelRedirect.current = true;
              connectToFuel();
            } else {
              setLoginOption('fuel');
            }
          }}
        />;
      case 'aeternity':
        return <Button
          key='aeternity'
          className='splash-login-button'
          role={role}
          text={<>
            <AeternityIcon className='w-5 h-5' /><br/>
            æternity
          </>}
          onClick={() => {
            if (!hasAeternityWallet) {
              window.open('https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne', '_blank', 'noreferrer');
            } else if (!isAeternityConnected) {
              enableAeternityRedirect.current = true;
              connectToWallet();
            } else {
              setLoginOption('aeternity');
            }
          }}
        />;
      case 'lukso':
        return <Button
          key='lukso'
          className='splash-login-button'
          role={role}
          text={<>
            <LuksoIcon className='w-5 h-5' /><br/>
            Universal Profile
          </>}
          onClick={() => {
            if (!hasUniversalProfileExtension) {
              window.open('https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn', '_blank', 'noreferrer');
            } else if (!isUniversalProfileConnected) {
              enableUniversalProfileRedirect.current = true;
              connectToUniversalProfile();
            } else {
              setLoginOption('universal-profile');
            }
          }}
        />;
      case 'keyphrase':
        return <Button
          key='12-word-keyphrase'
          className='splash-login-button'
          role={role}
          text={<>
            <DocumentTextIcon className='w-5 h-5' /><br/>
            Keyphrase (legacy)
          </>}
          onClick={() => setLoginOption('keyphrase')}
        />;
      case 'farcaster':
        return <Button
          key='farcaster'
          className='splash-login-button'
          role={role}
          text={<>
            <FarcasterIcon className='w-5 h-5' /><br/>
            Farcaster
          </>}
          onClick={() => setLoginOption('farcaster')}
        />;
      default:
        return null;
    }
  }

  return (<div className='flex flex-row flex-wrap items-center justify-start self-center gap-2 max-w-xs w-full'>
    {/*warning && <div className='flex items-start gap-1 self-stretch cg-text-secondary'>
      <InformationCircleIcon className='w-5 h-5 ' />
      <span className='cg-text-md-400'>{warning}</span>
    </div>*/}
    {availableButtons.map(btnType => renderButton(btnType))}
  </div>);
}

export default SplashLoginActions;