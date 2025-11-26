// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import BigWalletIcon from 'components/atoms/BigWalletIcon/BigWalletIcon';
import Button from 'components/atoms/Button/Button';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import userApi from 'data/api/user';
import getSiweMessage from 'util/siwe';
import { type OnboardingStep, type OnboardingWalletData } from 'context/UserOnboarding';
import type loginManager from 'data/appstate/login';

type Step = Extract<OnboardingStep, "create-other-option" | "login-other-option" | "create-profile-setup" | "login-finished">;

type Props = {
  step: Step;
  setStep: (step: OnboardingStep) => void;
  walletData: OnboardingWalletData | undefined;
}

type ButtonProps = Props & {
  signatureFinished: (data: API.User.prepareWalletAction.Request) => void;
  loginFinished: (loginOptions: Parameters<typeof loginManager.login>[0]) => Promise<void>;
};

export const defaultWalletText = "Please confirm ownership of this wallet";
export const defaultWalletButtonText = "Confirm ownership";

export function getWalletStatus(walletType: Models.Wallet.Type, address: string, step: Step, walletData: OnboardingWalletData | undefined) {
  let text = defaultWalletText;
  let buttonText = defaultWalletButtonText;
  let error: string | undefined;
  let loginInstead = false;
  let readyToProceed = false;

  // Only change if current wallet data is the selected wallet
  if (walletData?.request.type === walletType && address.toLowerCase() === walletData?.request.data.address.toLowerCase()) {
    if ((step === "create-other-option" || step === "create-profile-setup") && walletData.response.readyForCreation === false) {
      if (walletData.response.readyForLogin === true) {
        text = "This wallet is cannot be used for account creation because it is assigned to another user. Do you want to log in with it instead?"
        buttonText = "Log in";
        loginInstead = true;
      }
      else {
        error = "Wallet is assigned to an account and not allowed to log in.";
      }
    }
    else if ((step === "login-other-option" || step === "login-finished") && walletData.response.readyForLogin === false) {
      if (walletData.response.walletExists === false) {
        error = "This wallet does not exist";
      }
      else {
        error = "This wallet is not allowed to log in";
      }
    }
    else {
      text = "The ownership of this wallet has been confirmed."
      buttonText = "Proceed";
      readyToProceed = true;
    }
  }
  return { text, buttonText, error, loginInstead, readyToProceed };
}

export const RainbowStatus: React.FC<Props> = ({ step, walletData }) => {
  const { address } = useAccount();

  const status = useMemo(() => {
    if (!!address) return getWalletStatus("evm", address, step, walletData);
  }, [address, step, walletData]);

  return (<div className='flex flex-col py-8 px-4 items-center justify-between min-h-full'>
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        mounted,
      }) => {
        // lockModal?.(chainModalOpen || connectModalOpen || accountModalOpen);
        const connected = mounted && account && chain;
        const connectedAddress = account?.address.toLocaleLowerCase();

        return (
          <div className='flex flex-col gap-4 items-center justify-center h-full'>
            <BigWalletIcon walletAddress={connectedAddress || ''} />
            {connected && chain.unsupported && <Button className='w-full' role="primary" text="Wrong network" onClick={openChainModal} />}
            {connected && !chain.unsupported && (<>
              <div className='flex flex-col items-center justify-center gap-2'>
                <span className='cg-heading-3 cg-text-main text-center'>Wallet Connected</span>
                {status?.error && <span className='cg-text-lg-400 text-palette-error-700 text-center'>{status.error}</span>}
                {!status?.error && <span className='cg-text-lg-400 cg-text-main text-center'>{status?.text || defaultWalletText}</span>}
              </div>
            </>)}
          </div>
        );
      }}
    </ConnectButton.Custom>
  </div>);
}

export const RainbowSignButton: React.FC<ButtonProps> = ({ step, setStep, walletData, signatureFinished, loginFinished }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState<string | undefined>();

  const status = useMemo(() => {
    if (!!address) return getWalletStatus("evm", address, step, walletData);
  }, [address, step, walletData]);

  const overrideProceed = useMemo(() => {
    if (status?.loginInstead === true) {
      return () => loginFinished({ account: "wallet" });
    }
    else if (status?.readyToProceed === true) {
      if (step === "create-other-option") {
        return () => setStep("create-profile-setup");
      }
      else if (step === "login-other-option") {
        return () => loginFinished({ account: "wallet" });
      }
    }
  }, [step, setStep, status]);

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
        setError(undefined);
        await signatureFinished({ type: 'evm', data, signature });
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace('Error:', '');
        }
        setError(message);
      }
    }
  }, [address, chainId, signMessageAsync, signatureFinished]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
      }) => {
        // lockModal?.(chainModalOpen || connectModalOpen || accountModalOpen);
        const connected = mounted && account && chain;

        return (
          <Button
            key='splash-primary-button'
            className='splash-button'
            role='primary'
            text={status?.buttonText || defaultWalletButtonText}
            onClick={overrideProceed || linkCurrentWallet}
            disabled={!connected || !!status?.error}
          />
        );
      }}
    </ConnectButton.Custom>
  );
}