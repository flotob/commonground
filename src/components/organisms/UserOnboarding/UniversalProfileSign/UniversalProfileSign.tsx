// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useState } from "react";
import BigWalletIcon from "components/atoms/BigWalletIcon/BigWalletIcon";
import Button from "components/atoms/Button/Button";
import { useUniversalProfile } from "context/UniversalProfileProvider";
import loginManager from "data/appstate/login";
import { OnboardingStep } from "context/UserOnboarding";

type Step = Extract<OnboardingStep, "create-other-option" | "login-other-option" | "create-profile-setup" | "login-finished">;

type Props = {
  signatureFinished: (data: API.Lukso.PrepareLuksoAction.Request) => void;
  step: Step;
  luksoData: API.Lukso.PrepareLuksoAction.Response | undefined;
  readyForLoginOverride: () => void;
  readyForCreationOverride?: () => void;
};

export const UniversalProfileStatus: React.FC = () => {
  const {
    universalProfileAddress,
    error,
  } = useUniversalProfile();

  return React.useMemo(
    () => (
      <div className="grid grid-flow-row py-8 px-4 items-center justify-center min-h-full">
        <div className="grid grid-flow-row gap-4 items-center justify-center">
          <BigWalletIcon walletAddress={universalProfileAddress || ""} style={{ justifySelf: 'center' }} />
          <div className="grid grid-flow-row items-center justify-center gap-2">
            <span className="cg-heading-3 cg-text-main text-center">
              Universal Profile connected
            </span>
            <span className={`cg-text-lg-400 text-center ${!error ? 'cg-text-main' : 'text-palette-error-600'}`}>
              {!error ? "Please confirm ownership of this profile" : error}
            </span>
          </div>
        </div>
      </div>
    ),
    [universalProfileAddress, error]
  );
};

export function getLuksoStatus(step: Step, luksoData: API.Lukso.PrepareLuksoAction.Response | undefined) {
  let text = '';
  let buttonText = 'Confirm Ownership';
  let error: string | undefined;
  let loginInstead = false;
  let readyToProceed = false;
  if (!luksoData) {
    return { text, buttonText, error, loginInstead, readyToProceed };
  }

  // Only change if current wallet data is the selected wallet
    if ((step === "create-other-option" || step === "create-profile-setup") && luksoData.readyForCreation === false) {
      if (luksoData.readyForLogin === true) {
        text = "This wallet is cannot be used for account creation because it is assigned to another user. Do you want to log in with it instead?"
        buttonText = "Log in";
        loginInstead = true;
      }
      else {
        error = "Wallet is assigned to an account and not allowed to log in.";
      }
    }
    else if ((step === "login-other-option" || step === "login-finished") && luksoData.readyForLogin === false) {
      if (luksoData.universalProfileExists === false) {
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
  return { text, buttonText, error, loginInstead, readyToProceed };
}

export const UniversalProfileSignButton: React.FC<Props> = (props) => {
  const { signatureFinished, luksoData, readyForLoginOverride, readyForCreationOverride, step } = props;
  const {
    isConnected,
    confirmOwnership
  } = useUniversalProfile();
  const [isFetchingData, setIsFetchingData] = useState(false);
  const luksoStatus = useMemo(() => {
   return getLuksoStatus(step, luksoData);
  }, [luksoData, step]);

  const onConfirmOwnership = useCallback(async () => {
    try {
      setIsFetchingData(true);
      const result = await confirmOwnership();
      if (!result) {
        throw new Error('Could not sign wallet, please try again');
      }
      await signatureFinished(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingData(false);
    }
  }, [confirmOwnership, signatureFinished]);


  const overrideProceed = useMemo(() => {
    if (luksoData?.readyForLogin === true) {
      return readyForLoginOverride;
    }
    else if (luksoData?.readyForCreation === true) {
      return readyForCreationOverride;
    }
  }, [luksoData?.readyForLogin, luksoData?.readyForCreation, readyForLoginOverride, readyForCreationOverride]);

  return React.useMemo(
    () => (
      <Button
        text={luksoStatus.buttonText}
        onClick={overrideProceed || onConfirmOwnership}
        className="w-full"
        role="primary"
        disabled={!isConnected}
        loading={isFetchingData}
      />
    ),
    [isConnected, isFetchingData, luksoStatus.buttonText, onConfirmOwnership, overrideProceed]
  );
};
