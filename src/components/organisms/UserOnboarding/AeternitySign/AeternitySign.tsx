// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useState } from 'react'
import OnboardingLogo from '../OnboardingLogo';
import BigWalletIcon from 'components/atoms/BigWalletIcon/BigWalletIcon';
import Button from 'components/atoms/Button/Button';
import { useAeternityWallet } from 'context/AeternityWalletProvider';
import { type OnboardingStep, type OnboardingWalletData } from 'context/UserOnboarding';
import type loginManager from 'data/appstate/login';
import { defaultWalletButtonText, defaultWalletText, getWalletStatus } from '../RainbowSign/RainbowSign';

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

export const AeternityStatus: React.FC<Props> = ({ step, walletData }) => {
  const {
    address,
  } = useAeternityWallet();
  const status = useMemo(() => {
    if (!!address) return getWalletStatus("aeternity", address, step, walletData);
  }, [address, step, walletData]);

  return React.useMemo(() => (<div className='flex flex-col py-8 px-4 items-center justify-between min-h-full'>
    <div className='flex items-center justify-center'>
      <OnboardingLogo />
    </div>
    <div className='flex flex-col gap-4 items-center justify-center'>
      <BigWalletIcon walletAddress={address || ''} />
      <div className='flex flex-col items-center justify-center gap-2'>
        <span className='cg-heading-3 cg-text-main text-center'>Wallet Connected</span>
        {status?.error && <span className='cg-text-lg-400 text-palette-error-700 text-center'>{status.error}</span>}
        {!status?.error && <span className='cg-text-lg-400 cg-text-main text-center'>{status?.text || defaultWalletText}</span>}
      </div>
    </div>
  </div>), [address]);
}

export const AeternitySignButton: React.FC<ButtonProps> = ({ step, setStep, walletData, loginFinished, signatureFinished }) => {
  const {
    isConnected,
    address,
    linkCurrentWallet
  } = useAeternityWallet();
  const [error, setError] = useState<string | undefined>();
  const status = useMemo(() => {
    if (!!address) return getWalletStatus("aeternity", address, step, walletData);
  }, [address, step, walletData]);

  const onConfirmOwnership = useCallback(async () => {
    if (!!address) {
      try {
        const aeternityResult = await linkCurrentWallet();

        if (aeternityResult) {
          setError(undefined);
          await signatureFinished({ type: 'aeternity', ...aeternityResult });
        } else {
          throw new Error('Could not sign wallet, please try again');
        }
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace('Error:', '');
        }
        setError(message);
      }
    }
  }, [address, linkCurrentWallet, signatureFinished]);

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

  return React.useMemo(() => (
    <Button
      key='splash-primary-button'
      className='splash-button'
      role='primary'
      text={status?.buttonText || defaultWalletButtonText}
      onClick={overrideProceed || onConfirmOwnership}
      disabled={!isConnected || !!status?.error}
    />
  ), [isConnected, onConfirmOwnership]);
}