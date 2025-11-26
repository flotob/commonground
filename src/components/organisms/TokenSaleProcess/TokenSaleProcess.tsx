// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './TokenSaleProcess.css';
import React, { useState } from 'react';
import SumsubKyc from 'components/molecules/SumsubKyc/SumsubKyc';
import Button from 'components/atoms/Button/Button';
import AnimatedTabPageContainer from 'components/atoms/AnimatedTabPage/AnimatedTabPageContainer';
import AnimatedTabPage from 'components/atoms/AnimatedTabPage/AnimatedTabPage';
import CheckboxBase from 'components/atoms/CheckboxBase/CheckboxBase';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/20/solid';
import userApi from 'data/api/user';
import { useSidebarDataDisplayContext } from 'context/SidebarDataDisplayProvider';
import { EnvelopeSimple, FilePdf, TelegramLogo } from '@phosphor-icons/react';
import { ReactComponent as SwissFlag } from './swissflag.svg';
import { useNavigate } from 'react-router-dom';
import urls from 'data/util/urls';

type Props = {

};

type Step = 'intro' | 'saleTerms' | 'contactUs' | 'kyc' | 'success';

const screenOrder: Record<Step, number> = {
  intro: 0,
  saleTerms: 1,
  contactUs: 5,
  kyc: 2,
  success: 3,
};

const TokenSaleProcess: React.FC<Props> = () => {
  const navigate = useNavigate();
  const { closeSlider } = useSidebarDataDisplayContext();
  const [step, setStep] = useState<Step>('intro');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isSwiss, setIsSwiss] = useState(false);

  const goBack = () => {
    switch (step) {
      case 'intro':
      case 'saleTerms':
      case 'contactUs':
        setStep('intro');
        break;
      case 'kyc':
        setStep('saleTerms');
        break;
      case 'success':
        setStep('kyc');
        break;
    }
  }

  const continueToKyc = async () => {
    try {
      await userApi.setOwnExtraDataField({
        key: 'agreedToTokenSaleTermsTimestamp',
        value: new Date().toISOString(),
      });
      await userApi.setOwnExtraDataField({
        key: 'investsFromSwitzerland',
        value: {
          value: isSwiss,
          serverTimestamp: new Date().toISOString(),
        },
      });
      setStep('kyc');
    } catch (error) {
      console.error(error);
    }
  }

  return (<AnimatedTabPageContainer
    currentScreen={step}
    screenOrder={screenOrder}
  >
    {step !== 'intro' && <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
      <Button
        role="secondary"
        iconLeft={<ArrowLeftIcon className="w-5 h-5" />}
        onClick={goBack}
        className="cg-circular tray-btn"
      />
    </div>}
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
      <Button
        role="secondary"
        iconLeft={<XMarkIcon className="w-5 h-5" />}
        onClick={() => {
          setStep('intro');
          closeSlider();
        }}
        className="cg-circular tray-btn"
      />
    </div>
    <div className="flex flex-col items-center cg-text-main cg-text-lg-400">
      <AnimatedTabPage
        visible={step === 'intro'}
        className="flex flex-col items-center gap-8 p-8 pt-20"
      >
        <h1 className='text-center'>Common Ground<br />Token Sale</h1>
        <div className='flex flex-col items-center p-4 gap-8 cg-border-xl w-full cg-content-stack'>
          <h3>How would you like to invest?</h3>
          <div className="flex flex-col gap-4 w-full">
            <Button
              role='secondary'
              text='Invest as an individual'
              onClick={() => setStep('saleTerms')}
              className='w-full'
              iconRight={<ArrowRightIcon className="w-5 h-5" />}
            />
            <Button
              role='secondary'
              text='Invest on behalf of a fund'
              onClick={() => setStep('contactUs')}
              className='w-full'
              iconRight={<ArrowRightIcon className="w-5 h-5" />}
            />
          </div>
        </div>
      </AnimatedTabPage>
      <AnimatedTabPage
        visible={step === 'saleTerms'}
        className="flex flex-col items-center justify-between gap-8 p-8 pt-20"
      >
        <h1 className='text-center'>Review the terms and conditions</h1>
        <div className='flex flex-col gap-8 p-4 cg-border-xl w-full cg-content-stack'>
          <a
            href={`${urls.APP_URL}/downloads/${encodeURIComponent('Token Purchase Agreement.pdf')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline btnSecondary w-full gap-2"
          >
            View Terms & Conditions (PDF) <FilePdf weight='duotone' className="w-5 h-5 cg-text-secondary" />
          </a>
          <div className='flex flex-col gap-3 w-full'>
            <div className="flex items-center gap-2 py-2 px-3 cursor-pointer" onClick={() => setIsTermsAccepted(!isTermsAccepted)}>
              <CheckboxBase
                checked={isTermsAccepted}
                type="checkbox"
                size="large"
              />
              <p className='cg-text-lg-500'>I have read and agree to the terms and conditions.</p>
            </div>
            <div className="flex items-center gap-2 py-2 px-3 cursor-pointer" onClick={() => setIsSwiss(!isSwiss)}>
              <CheckboxBase
                checked={isSwiss}
                type="checkbox"
                size="large"
              />
              <p className='cg-text-lg-500 flex items-center gap-1'>Are you investing from inside Switzerland? <SwissFlag className='w-5 h-5' /></p>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center gap-8 p-4 w-full cg-border-xl cg-content-stack'>
          <h3 className='cg-text-secondary text-center'>Next, complete our quick KYC (Know Your Customer) process to join the token sale!</h3>
          <Button
            disabled={!isTermsAccepted}
            role="primary"
            text="Start KYC"
            onClick={continueToKyc}
            className='w-full'
          />
        </div>
      </AnimatedTabPage>
      <AnimatedTabPage
        visible={step === 'contactUs'}
        className="flex flex-col items-center gap-6 p-8 pt-20"
      >
        <h1 className='text-center'>Invest on behalf of a fund</h1>
        <div className='flex flex-col items-center p-4 gap-8 cg-border-xl w-full cg-content-stack'>
          <h3 className='text-center cg-text-secondary'>If you’re investing on behalf of a fund, please contact us per email</h3>
          <div className="flex flex-col gap-4 w-full">
            <a
              href="mailto:ola@dao.cg"
              className="btnSecondary gap-1"
            >
              <EnvelopeSimple weight='duotone' className="w-5 h-5" />
              ola@dao.cg
            </a>
          </div>
        </div>
      </AnimatedTabPage>
      <AnimatedTabPage
        visible={step === 'kyc'}
        className="flex flex-col items-center gap-6 p-8 pt-16"
      >
        <SumsubKyc
          kycType="cg-tokensale"
          sidebarMode
          onSuccessSidebar={() => setStep('success')}
          handleWizardAction={() => { }}
          actions={[]}
        />
        <p className="cg-text-lg-500">Having Trouble?</p>
        <Button
          role="secondary"
          text="Contact us on Common Ground"
          // TODO: Navigate instead of window open
          onClick={() => navigate('/c/commonground/channel/token-sale-support/')}
        />
        <Button
          role="secondary"
          text="Contact us on Telegram"
          onClick={() => window.open('https://t.me/+ghYaoJ-Afv05NDli', '_blank', 'noopener,noreferrer')}
        />
      </AnimatedTabPage>
      <AnimatedTabPage
        visible={step === 'success'}
        className="flex flex-col items-center justify-between gap-6 p-8 pt-20"
      >
        <img
          src="/logo.svg"
          width={70}
          height={70}
          alt="Common Ground Logo"
        />
        <h1 className='text-center'>You’re done! 🎉</h1>
        <div className='flex flex-col items-center p-4 gap-8 cg-border-xl w-full cg-content-stack'>
          <h3 className='text-center cg-text-secondary'>You can now invest directly from the sales page.</h3>
          <Button
            role="primary"
            text="Done"
            onClick={() => {
              closeSlider();
              setStep('intro');
            }}
          />
        </div>
      </AnimatedTabPage>
    </div>
  </AnimatedTabPageContainer>);
};

export default TokenSaleProcess;
