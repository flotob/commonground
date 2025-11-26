// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useAccount,
  useNetwork,
  useSwitchNetwork,
  usePrepareSendTransaction,
  useSendTransaction,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import config from 'common/config';
import { chainIds } from 'common/chainIds';
import { type InvestmentTarget } from 'common/investmentTargets';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { providers } from 'ethers';
import { erc20ABI } from 'wagmi';
import communityApi from 'data/api/community';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import { useSnackbarContext } from 'context/SnackbarContext';
import { useAsyncMemo } from 'hooks/useAsyncMemo';
import { Spinner } from "@phosphor-icons/react";
import { useCommunityWizardContext } from 'context/CommunityWizardProvider';
import urlConfig from '../../../data/util/urls';

type Props = {
  onNext: (txHash: string) => Promise<void>;
  investmentTargetName: Models.Wizard.ValidInvestmentTarget;
  investmentTarget: InvestmentTarget;
  wizardId: string;
  stepId: number;
  alreadyInvestedBefore?: boolean;
};

const confirmationsRequired = 1;

const WizardInvest: React.FC<Props> = ({ onNext, investmentTargetName, investmentTarget, wizardId, stepId, alreadyInvestedBefore }) => {
  const { chain: propsChain, beneficiaryAddress, minimumAmount, decimals, token, hardCap } = investmentTarget;
  const [amount, setAmount] = useState('');
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [amountWarning, setAmountWarning] = useState<string | null>(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<false | 'signing' | 'processing' | 'wait-backend'>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [investorName, setInvestorName] = useState('');
  const [investorAddress, setInvestorAddress] = useState('');
  const [isLegalEntity, setIsLegalEntity] = useState(false);
  const [manualTxHash, setManualTxHash] = useState('');
  const amountChangeDebounceRef = useRef<any>(undefined);
  const [updateProgressCounter, setUpdateProgressCounter] = useState(0);

  const { address: walletAddress, connector } = useAccount();
  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { showSnackbar } = useSnackbarContext();
  const { wizardUserData, setWizardStepData } = useCommunityWizardContext();

  const hasFilledInvestorDetails = useMemo(() => {
    const stepIds = Object.keys(wizardUserData?.stepData ?? {}) as `${number}`[];
    return stepIds.some(stepId => wizardUserData?.stepData[stepId]?.type === 'investorDetailsFilled');
  }, [wizardUserData]);

  const [step, setStep] = useState<'terms' | 'payment'>(alreadyInvestedBefore || hasFilledInvestorDetails ? 'payment' : 'terms');

  const isDevEnvironment = config.DEPLOYMENT === 'dev';
  const chainId = chainIds[propsChain];
  const isAllowedNetwork = chain?.id === chainId;

  const parsedHardCap = useMemo(() => BigInt(parseUnits(hardCap, decimals).toString()), [hardCap, decimals]);

  const providerFromWallet = useAsyncMemo(async () => {
    const provider = await connector?.getProvider();
    if (!provider) {
      return null;
    }
    return new providers.Web3Provider(provider);
  }, [chain, connector]);
  
  const [parsedAmount, setParsedAmount] = useState<bigint>(BigInt(0));

  const isERC20 = token.type === 'erc20' && token.address !== null;

  const { config: prepareContractConfig, error: prepareContractError } = usePrepareContractWrite({
    address: isERC20 ? token.address! : undefined,
    abi: isERC20 ? erc20ABI : undefined,
    functionName: isERC20 ? 'transfer' : undefined,
    args: isERC20 ? [beneficiaryAddress, parsedAmount] : undefined,
    enabled: isERC20 && parsedAmount > 0 && isAllowedNetwork,
  });

  const { data: contractWriteData, isLoading: isContractWriteLoading, write: contractWrite, error: contractWriteError } = useContractWrite(prepareContractConfig);

  const { config: prepareSendConfig, error: prepareSendError } = usePrepareSendTransaction({
    to: isERC20 ? undefined : beneficiaryAddress,
    value: isERC20 ? undefined : parsedAmount,
    enabled: !isERC20 && parsedAmount > 0 && isAllowedNetwork,
  });

  const { data: sendTransactionData, isLoading: isSendTransactionLoading, sendTransaction, error: sendTransactionError } = useSendTransaction(prepareSendConfig);

  const sendData = isERC20 ? contractWriteData : sendTransactionData;
  const isSendLoading = isERC20 ? isContractWriteLoading : isSendTransactionLoading;
  const executeTransaction = () => {
    if (isERC20) {
      contractWrite?.();
    } else {
      sendTransaction?.();
    }
  };
  const prepareError = isERC20 ? prepareContractError : prepareSendError;

  const saleBalance = useAsyncMemo(async () => {
    if (!investmentTargetName) {
      return undefined;
    }
    return BigInt((await communityApi.wizardGetInvestmentTargetBeneficiaryBalance({ target: investmentTargetName })).balance);
  }, [investmentTargetName, updateProgressCounter]);

  const maximumInvestment = useMemo(() => saleBalance !== undefined ? parsedHardCap - saleBalance : parsedHardCap, [saleBalance, parsedHardCap]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateProgressCounter(value => value + 1);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contractWriteError || sendTransactionError) {
      console.log("INVESTMENT PREPARE ERROR", contractWriteError, sendTransactionError);
      setIsWaitingForConfirmation(false);
    }
  }, [contractWriteError, sendTransactionError]);

  useEffect(() => {
    if (sendData?.hash && providerFromWallet) {
      setIsWaitingForConfirmation('processing');
      setTransactionError(null);
      let timeout: any;
      let interval: any;

      interval = setInterval(async () => {
        try {
          const tx = await providerFromWallet.getTransaction(sendData.hash);
          console.log("INVESTMENT TX FOUND", tx);
          if (!!tx) {
            if (tx.confirmations >= confirmationsRequired) {
              clearInterval(interval);
              clearTimeout(timeout);
              setIsWaitingForConfirmation('wait-backend');
              setTimeout(() => informBackendAboutPayment(sendData.hash), 1_000);
            }
          }
        } catch (error) {
          console.log("INVESTMENT TX QUERY ERROR", error);
        }
      }, 2_000);

      timeout = setTimeout(() => {
        setIsWaitingForConfirmation(false);
        setTransactionError("Transaction confirmation timed out, please try again. If your transaction was confirmed in your wallet, please go back and manually enter the transaction hash.");
        clearInterval(interval);
      }, 300_000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [providerFromWallet, sendData?.hash]);

  const informBackendAboutPayment = async (txHash: string) => {
    try {
      await onNext(txHash);
      setTransactionSuccess(true);
    } catch (error) {
      setTransactionError(`Failed to proceed to next step: ${error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'}`);
    } finally {
      setIsWaitingForConfirmation(false);
    }
  };

  const parsedMinimumAmount = useMemo(() => {
    return BigInt(parseUnits(minimumAmount, decimals).toString());
  }, [minimumAmount, decimals]);

  const handleAmountChange = useCallback((value: string) => {
    if (!value.match(/^\d*$/)) {
      return;
    }
    value = value.replace(/^0+/, ''); // remove preceding zeros
    setAmount(value);
    try {
      const parsed = parseUnits(value, decimals);
      setParsedAmount(BigInt(parsed.toString()));
      setAmountWarning(null);
      clearTimeout(amountChangeDebounceRef.current);
      if (!alreadyInvestedBefore && parsed.lt(parsedMinimumAmount)) {
        amountChangeDebounceRef.current = setTimeout(() => {
          setAmountWarning(`Minimum investment amount is ${minimumAmount}`);
        }, 1_000);
      }
      else if (parsed.gt(maximumInvestment)) {
        setAmountWarning(`Cannot invest more than ${formatUnits(maximumInvestment, decimals)} ${token.symbol} since it would exceed the hard cap`);
      }
    } catch (error) {
      setAmount('');
      setParsedAmount(BigInt(0));
      setAmountWarning('Invalid amount');
    }
  }, [minimumAmount, parsedMinimumAmount, maximumInvestment, alreadyInvestedBefore, decimals, token.symbol]);

  const isPayButtonDisabled = useMemo(() => {
    if (alreadyInvestedBefore && parsedAmount > BigInt(0)) {
      return isSendLoading || !!prepareError || !!amountWarning;
    }
    return isSendLoading || parsedAmount < parsedMinimumAmount || !!prepareError || !!amountWarning;
  }, [isSendLoading, parsedAmount, parsedMinimumAmount, prepareError, amountWarning]);

  const walletConnected = useMemo(() => {
    return !!walletAddress && !!chain;
  }, [walletAddress, chain]);

  const isTermsStepValid = useMemo(() => {
    return (
      parseFloat(amount) >= parseFloat(minimumAmount) &&
      investorName.trim() !== '' &&
      investorAddress.trim() !== '' &&
      !amountWarning
    );
  }, [amount, minimumAmount, investorName, investorAddress, amountWarning]);

  useEffect(() => {
    const stepIds = Object.keys(wizardUserData?.stepData ?? {}) as `${number}`[];
    const hasFilledInvestorDetails = stepIds.some(stepId => wizardUserData?.stepData[stepId]?.type === 'investorDetailsFilled');
    if (
      step === 'payment' &&
      !(alreadyInvestedBefore || hasFilledInvestorDetails)
    ) {
      if (!amountWarning) {
        setAmountWarning('You have to fill in your name and address before you can make an investment');
      }
    }
  }, [step, wizardUserData, alreadyInvestedBefore, amountWarning]);

  if (step === 'terms') {
    return (
      <div className='flex flex-col gap-6 px-4 py-8'>
        <h2 className='text-2xl font-bold'>Deal Terms</h2>
        <p>
          Investments are essentially structured as a SAFE with a token warrant. There is a 20%
          discount to the upcoming venture round. Details are in the document below.
        </p>
        <Button
          role='secondary'
          text='Download PDF'
          onClick={() => window.open(`${urlConfig.API_BASE_URL}/gated-files/hidden.pdf`, '_blank')}
        />
        
        <h3 className='text-xl font-semibold mt-4'>Your Commitment</h3>
        <p>All amounts are in US Dollars</p>
        <TextInputField
          type='text'
          value={amount}
          onChange={handleAmountChange}
          placeholder={`Amount in ${token.symbol} ${!alreadyInvestedBefore ? `(min ${minimumAmount.replace(/\.\d+$/, '')})` : ''}`}
        />
        {amountWarning && <span className='cg-text-warning cg-text-lg-400'>{amountWarning}</span>}
        
        <h3 className='text-xl font-semibold mt-4'>Your name and address</h3>
        <p>Enter your name and address if you're investing as a private person. If you're investing with a holding, put its name and address instead.</p>
        <TextInputField
          value={investorName}
          onChange={setInvestorName}
          placeholder='Name'
        />
        <TextInputField
          value={investorAddress}
          onChange={setInvestorAddress}
          placeholder='Address'
        />
        <div className='flex items-center gap-2 mb-2'>
          <input
            type='checkbox'
            checked={isLegalEntity}
            onChange={(e) => setIsLegalEntity(e.target.checked)}
          />
          <label onClick={() => setIsLegalEntity(!isLegalEntity)}>I'm investing with a legal entity (and have entered its name and address above)</label>
        </div>
        
        <Button
          role='primary'
          text='Make a legally binding investment now'
          onClick={async () => {
            const value = {
              type: 'investorDetailsFilled' as const,
              name: investorName,
              address: investorAddress,
              isLegalEntity
            };
            await setWizardStepData(stepId, value);
            setStep('payment');
          }}
          disabled={!isTermsStepValid}
        />
      </div>
    );
  }

  if (isWaitingForConfirmation) {
    return (
      <div className='flex flex-col items-center gap-4 px-4 h-full justify-center cg-text-main'>
        {isWaitingForConfirmation === 'processing' || isWaitingForConfirmation === 'wait-backend' ? (
          <>
            <Spinner className="spinner" style={{ color: 'color(display-p3 0.8353 0.0627 0.0275)' }} />
            <p className="cg-heading-3">Got your signature 🎉</p>
            <p className="cg-heading-3">Processing payment...</p>
            <p className="cg-text-secondary">This could take a moment</p>
          </>
        ) : (
          <>
            <Spinner className="spinner" style={{ color: 'color(display-p3 0.8353 0.0627 0.0275)' }} />
            <p className="cg-heading-3">Waiting for your signature...</p>
          </>
        )}
      </div>
    );
  }

  if (transactionSuccess) {
    return (
      <div className='flex flex-col items-center gap-4 px-4 cg-text-main'>
        <h2>Payment Successful!</h2>
        <p>Thank you for your investment.</p>
        <p>Transaction Hash: {sendData?.hash}</p>
        <Button
          role='primary'
          text="Close"
          onClick={() => {/* Handle closing or navigation */}}
        />
      </div>
    );
  }

  return (<div className='flex flex-col gap-12'>
    <div className='flex flex-col items-center gap-4 mt-8'>
      <h1>Invest</h1>
      {config.DEPLOYMENT !== 'prod' && <p className='cg-text-warning text-center cg-text-lg-400'>This is a test environment. Do not invest real money.</p>}
      <div className='flex flex-col gap-4 w-full'>
        <TextInputField
          inputClassName='w-full'
          type='text'
          value={amount}
          onChange={handleAmountChange}
          placeholder={`Amount in ${token.symbol} ${!alreadyInvestedBefore ? `(min ${minimumAmount.replace(/\.\d+$/, '')})` : ''}`}
        />
        {amountWarning && <span className='cg-text-warning cg-text-lg-400'>{amountWarning}</span>}
        {!walletConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button
                className='w-full'
                role='primary'
                text='Connect Wallet to Pay'
                onClick={openConnectModal}
              />
            )}
          </ConnectButton.Custom>
        ) : !isAllowedNetwork ?
          (
            <div className='flex flex-col px-4 gap-4 cg-text-main'>
              <h3>Switch to {isDevEnvironment ? 'Hardhat' : 'Ethereum Mainnet'}</h3>
              <Button
                key={chainId}
                role='primary'
                text={`Switch to ${config.AVAILABLE_CHAINS[propsChain].title}`}
                onClick={() => switchNetworkAsync?.(chainId)}
              />
            </div>
          )
         : (
          <Button
            className='w-full'
            role='primary'
            text={isSendLoading ? 'Processing...' : 'Pay'}
            onClick={() => {
              setTransactionError(null);
              executeTransaction();
              setIsWaitingForConfirmation('signing');
            }}
            disabled={isPayButtonDisabled}
          />
        )}
        {transactionError && (
          <div className='flex flex-col items-center gap-2'>
            <span className='cg-text-warning cg-text-lg-400'>{transactionError}</span>
            <Button
              role='secondary'
              text="Try Again"
              onClick={() => {
                setTransactionError(null);
                setIsWaitingForConfirmation(false);
              }}
            />
          </div>
        )}
        {prepareError && <span className='cg-text-warning cg-text-lg-400'>{prepareError.message}</span>}
      </div>
    </div>
    <div className='flex flex-col items-center gap-8'>
      <h2>or send {token.symbol} manually</h2>
      <p className='break-words max-w-full'>
        The sale target address is<br/>
        <a onClick={() => {
          navigator.clipboard.writeText(beneficiaryAddress);
          showSnackbar({
            type: 'success',
            text: 'Copied to clipboard'
          });
        }} className='cursor-pointer underline'>
          <ClipboardDocumentIcon className='w-4 h-4' /> {beneficiaryAddress}
        </a>
      </p>
      <p>
        When your transaction has been confirmed, enter the transaction hash below
      </p>
      <div className='flex flex-col gap-4 w-full'>
        <TextInputField
          inputClassName='w-full'
          placeholder='Enter transaction hash (0x...)'
          value={manualTxHash}
          onChange={setManualTxHash}
        />
      </div>
      <Button
        className='w-full'
        role='primary'
        text="I've sent it manually"
        onClick={() => informBackendAboutPayment(manualTxHash)}
        disabled={!manualTxHash.startsWith('0x') || manualTxHash.length !== 66}
      />
    </div>
    <div className='flex flex-col items-center gap-8 pb-8'>
      <h2>or pay with fiat</h2>
      <p>
        If you can't pay with crypto, ping us on Telegram and we'll help you out.
      </p>
      <Button
        className='w-full'
        role='primary'
        text="Ping us on Telegram"
      />
    </div>
  </div>);
}

export default React.memo(WizardInvest);
