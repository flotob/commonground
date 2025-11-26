// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './FullscreenWizard.css'; // Import corresponding CSS file if needed
import AnimatedTabPageContainer from 'components/atoms/AnimatedTabPage/AnimatedTabPageContainer';
import AnimatedTabPage from 'components/atoms/AnimatedTabPage/AnimatedTabPage';
import { AllContentRenderer } from 'components/molecules/MesssageBodyRenderer/MessageBodyRenderer';
import Button from 'components/atoms/Button/Button';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import Modal from 'components/atoms/Modal/Modal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SumsubKyc from 'components/molecules/SumsubKyc/SumsubKyc';
import WizardInvest from './WizardInvest';
import WizardStartOrLogin from './WizardStartOrLogin';
import WizardOGView from './WizardOGView';
import { useCommunityWizardContext } from 'context/CommunityWizardProvider';
import loginManager from 'data/appstate/login';
import communityApi from 'data/api/community';
import { getUrl } from 'common/util';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import WizardShareLink from './WizardShareLink';
import { investmentTargets } from 'common/investmentTargets';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { useOwnUser } from 'context/OwnDataProvider';
import WizardEmailView from './WizardEmailView';
import userApi from 'data/api/user';
import { useSnackbarContext } from 'context/SnackbarContext';
import { parseUnits } from 'ethers/lib/utils';
import WizardNdaConfirmCheckboxView from './WizardNdaConfirmCheckboxView';
import WizardDataRoom from './WizardDataRoom';
import WizardAmericanConfirmCheckboxView from './WizardAmericanConfirmCheckboxView';
import { Spinner } from '@phosphor-icons/react';
import WizardLoginFallback from './WizardLoginFallback';
import errors from 'common/errors';

interface FullscreenWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardState = {
  verificationCode?: string;
  email?: string;
};

const FALLBACK_DATA: Models.Wizard.WizardStep[] = [
  {
    stepId: 0,
    type: 'loginFallback',
    action: {
      text: `Close`,
      role: 'primary',
      action: {
        type: 'goto',
        navigate: {
          type: 'close',
        },
      },
    },
  }
];

const FullscreenWizard: React.FC<FullscreenWizardProps> = (props) => {
  const { isOpen, onClose } = props;
  const ownUser = useOwnUser();
  const { isMobile } = useWindowSizeContext();
  const { showSnackbar } = useSnackbarContext();
  const { isLoading, wizardId, wizard, wizardUserData } = useCommunityWizardContext();
  const { community } = useLoadedCommunityContext();
  const navigate = useNavigate();
  const wizardSteps = wizard?.steps || FALLBACK_DATA;
  const screenOrder = useMemo(() => {
    return wizardSteps.reduce((acc, step) => {
      acc[step.stepId] = step.stepId;
      return acc;
    }, {} as Record<number, number>);
  }, [wizardSteps]);
  const [skippingToCurrentWizard, setSkippingToCurrentWizard] = useState(false);

  // looks weird since wizardData seems unused, but it's used indirectly through setWizardData as setter parameter
  const [wizardData, setWizardData] = useState<WizardState>({});

  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentPageId = useMemo(() => {
    const fromParams = searchParams.get('wizardStep') ? parseInt(searchParams.get('wizardStep')!) : 0;
    if ((!!fromParams && wizardSteps === FALLBACK_DATA && !wizardSteps[fromParams] && isLoading === false)) {
      return 0;
    }
    return fromParams;
  }, [searchParams, wizardSteps, isLoading]);

  const setCurrentPage = useCallback((page: number) => {
    setSearchParams({ ...searchParams, wizardStep: page.toString() });
  }, [searchParams, setSearchParams]);

  const kycType: API.Sumsub.KycType | null = useMemo(() => {
    const kycCondition = wizard?.successConditions.find(condition => condition.type.startsWith('kyc'));
    if (kycCondition) {
      switch (kycCondition.type) {
        case 'kycLiveness':
          return 'liveness-only';
        case 'kycFull':
          return 'full-kyc-level';
        case 'kycCgTokensale':
          return 'cg-tokensale';
      }
    }
    return null;
  }, [wizard?.successConditions]);

  useEffect(() => {
    if (wizardSteps === FALLBACK_DATA && !wizardSteps[currentPageId] && isLoading === false) {
      setCurrentPage(0);
    }
  }, [wizardSteps, currentPageId, isLoading]);

  const handleNavigate = useCallback((wizardNavigate: Models.Wizard.WizardNavigate) => {
    if (wizardNavigate.type === 'wizard') {
      navigate(getUrl({ type: 'community-wizard', community: { url: community.url }, wizardId: wizardNavigate.wizardId }));
    } else if (wizardNavigate.type === 'step') {
      setCurrentPage(wizardNavigate.stepId);
    } else if (wizardNavigate.type === 'close') {
      onClose();
    } else if (wizardNavigate.type === 'openLink') {
      window.open(wizardNavigate.link, '_blank', 'noopener,noreferrer');
    }
  }, [community.url, navigate, onClose, setCurrentPage]);

  useEffect(() => {
    let _wizard = wizard;
    let _wizardUserData = wizardUserData;
    //check if user has already completed the wizard and navigate to the next one
    if (!!_wizard && _wizardUserData?.state === 'success' && _wizard.onSuccessNavigate.type === 'wizard' && !skippingToCurrentWizard && !isLoading) {
      setSkippingToCurrentWizard(true);      
      (async () => {
        let navigateWizardId: string | undefined = undefined;
        while (!!_wizard && _wizardUserData?.state === 'success' && _wizard.onSuccessNavigate.type === 'wizard') {
          navigateWizardId = _wizard.onSuccessNavigate.wizardId;
          const result: API.Community.Wizard.getWizardData.Response = await communityApi.getWizardData({ wizardId: navigateWizardId });
          _wizard = result.wizardData;
          _wizardUserData = result.userData;
        }
        if (navigateWizardId) {
          handleNavigate({ type: 'wizard', wizardId: navigateWizardId });
        }
      })()
      .catch(error => {
        console.error('Error skipping to current wizard', error);
      })
      .finally(() => {
        setTimeout(() => {
          setSkippingToCurrentWizard(false);
        }, 200);
      });
    }
  }, [handleNavigate, wizard, wizardId, wizardUserData?.state, skippingToCurrentWizard, isLoading]);

  const handleKycNavigation = useCallback(async (action: Models.Wizard.WizardAction) => {
    let kycSuccess: boolean;
    switch (kycType) {
      case 'liveness-only':
        kycSuccess = ownUser?.extraData?.kycLivenessSuccess || false;
        break;
      case 'full-kyc-level':
        kycSuccess = ownUser?.extraData?.kycFullSuccess || false;
        break;
      case 'cg-tokensale':
        kycSuccess = ownUser?.extraData?.kycCgTokensaleSuccess || false;
        break;
      default:
        kycSuccess = false;
    }
    if ('navigate' in action.action && (kycSuccess || action.action.navigate.type === 'openLink')) {
      handleNavigate(action.action.navigate)
    } else {
      showSnackbar({ type: 'warning', text: 'KYC verification failed or not completed yet' });
    }
  }, [handleNavigate, kycType, ownUser?.extraData?.kycLivenessSuccess, ownUser?.extraData?.kycFullSuccess, showSnackbar]);

  const handleWizardAction = useCallback(async (action: Models.Wizard.WizardAction, wizardState?: WizardState) => {
    if (action.action.type === 'createAccount') {
      const verificationCode = wizardState?.verificationCode;
      const email = wizardState?.email;

      if (ownUser) {
        if (!!verificationCode && !!wizardId) {
          await userApi.redeemWizardCode({ code: verificationCode, wizardId });
        }
      } else {
        if (!!email) {
          const emailAvailable = await userApi.isEmailAvailable({ email });
          if (!emailAvailable) {
            showSnackbar({ type: 'warning', text: 'Email is already in use, please try logging in' });
            return;
          }
        }
      }

      if (!!wizardId && !!verificationCode && !!email) {
        if (!ownUser) {
          await loginManager.createUser({
            displayAccount: 'cg',
            recaptchaToken: verificationCode,
            useWizardCode: {
              wizardId: wizardId,
              code: verificationCode,
              email,
            }
          });
        }

        try {
          await communityApi.wizardFinished({
            wizardId: wizardId,
            tryResult: 'success',
          });
        } catch (error) {
          if (error instanceof Error && error.message === errors.server.WIZARD_SUCCESS_LIMIT_EXCEEDED) {
            showSnackbar({ type: 'warning', text: 'The maximum number of slots has been reached' });
          } else {
            showSnackbar({ type: 'warning', text: `Failed to proceed: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
          throw error;
        }

        if (wizard) handleNavigate(wizard.onSuccessNavigate);
      }
    } else if (action.action.type === 'success') {
      if (!!wizardId) {
        try {
          await communityApi.wizardFinished({
            wizardId: wizardId,
            tryResult: 'success',
          });
        } catch (error) {
          if (error instanceof Error && error.message === errors.server.WIZARD_SUCCESS_LIMIT_EXCEEDED) {
            showSnackbar({ type: 'warning', text: 'The maximum number of slots has been reached' });
          } else {
            showSnackbar({ type: 'warning', text: `Failed to proceed: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
          throw error;
        }
      }

      if (wizard) handleNavigate(wizard.onSuccessNavigate);
    } else if (action.action.type === 'failure') {
      if (!!wizardId) {
        await communityApi.wizardFinished({
          wizardId: wizardId,
          tryResult: 'failure',
        });
      }

      if (wizard) handleNavigate(wizard.onFailureNavigate);
    }

    if ('navigate' in action.action) {
      const currentStep = wizardSteps.find(step => step.stepId === currentPageId);
      if (currentStep?.type === 'kyc') {
        handleKycNavigation(action);
      } else {
        handleNavigate(action.action.navigate);
      }
    }
  }, [currentPageId, handleKycNavigation, handleNavigate, ownUser, showSnackbar, wizard, wizardId, wizardSteps]);

  if (!isOpen) return null;

  return (
    <Modal
      noDefaultScrollable
      hideHeader
      modalInnerClassName='fullscreen-wizard-modal'
    >
      <AnimatedTabPageContainer currentScreen={currentPageId} screenOrder={screenOrder} className={`overflow-hidden h-full fullscreen-wizard-content${!isMobile ? ' cg-content-stack cg-border-xxl wizard-large-padding' : ''}`}>
        {(!!isLoading || !!skippingToCurrentWizard) && <AnimatedTabPage key='loading' visible={true} className='fullscreen-wizard-step'>
          <div className='flex items-center justify-center h-full'>
            <Spinner className='spinner w-8 h-8' />
          </div>
        </AnimatedTabPage>}
        {!(!!isLoading || !!skippingToCurrentWizard) && wizardSteps.map(step => {
          if (step.type === 'loginFallback') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardLoginFallback
                onNext={() => handleWizardAction(step.action)}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'startOrLogin' && !!wizardId) {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardStartOrLogin
                onNext={(code: string) => {
                  setWizardData(oldWizardData => {
                    const newData = { ...oldWizardData, verificationCode: code };
                    handleWizardAction(step.action, newData);
                    return newData;
                  });
                }}
                wizardId={wizardId}
              // debugMode={config.DEPLOYMENT !== 'prod'} // FIXME: REMOVE ME AFTER DEMO OR FOR TESTING
              />
            </AnimatedTabPage>;
          } else if (step.type === 'OGView') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardOGView
                action={step.action}
                onNext={() => handleWizardAction(step.action)}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'invest') {
            const investmentTarget = investmentTargets[step.target];

            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <Scrollable>
                <WizardInvest
                  onNext={async (txHash) => {
                    if (!wizardId) {
                      throw new Error('Wizard ID is required');
                    }
                    const { success, message, newInvestmentAmount } = await communityApi.wizardClaimInvestmentTransaction({ txHash, wizardId });
                    if (success && newInvestmentAmount) {
                      if (BigInt(newInvestmentAmount) >= BigInt(parseUnits(investmentTarget.minimumAmount, investmentTarget.decimals).toString())) {
                        await handleWizardAction(step.action);
                      } else {
                        throw new Error('Insufficient payment amount');
                      }
                    } else {
                      throw new Error(message);
                    }
                  }}
                  investmentTargetName={step.target}
                  investmentTarget={investmentTarget}
                  wizardId={wizardId!}
                  stepId={step.stepId}
                  alreadyInvestedBefore={step.alreadyInvestedBefore}
                />
              </Scrollable>
            </AnimatedTabPage>;
          } else if (step.type === 'emailView') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardEmailView
                content={step.content}
                action={step.action}
                actionBack={step.actionBack}
                handleWizardAction={handleWizardAction}
                onNext={(email) => {
                  setWizardData(oldWizardData => {
                    const newData = { ...oldWizardData, email };
                    handleWizardAction(step.action, newData);
                    return newData;
                  });
                }}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'ndaConfirmCheckboxView') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardNdaConfirmCheckboxView
                content={step.content}
                action={step.action}
                checkboxText={step.checkboxText}
                stepId={step.stepId}
                onNext={() => handleWizardAction(step.action)}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'americanConfirmCheckboxView') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardAmericanConfirmCheckboxView
                content={step.content}
                action={step.action}
                checkboxText={step.checkboxText}
                stepId={step.stepId}
                onNext={() => handleWizardAction(step.action)}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'dataRoom') {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <WizardDataRoom
                sections={step.sections}
                actions={step.actions}
                handleWizardAction={handleWizardAction}
                investmentTarget={wizard?.investmentTarget}
              />
            </AnimatedTabPage>;
          } else if (step.type === 'kyc' && !!kycType) {
            return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step`}>
              <SumsubKyc
                kycType={kycType}
                handleWizardAction={handleWizardAction}
                actions={step.actions}
              />
            </AnimatedTabPage>;
          }

          const actionsArray = 'actions' in step ? step.actions : [step.action];

          return <AnimatedTabPage key={`step-${step.stepId}`} visible={currentPageId === step.stepId} className={`fullscreen-wizard-step${'actions' in step && step.actions.length > 0 ? ' gap-1' : ''}`}>
            <Scrollable>
              {step.type === 'startOrLogin' && wizardId && <WizardStartOrLogin
                onNext={(code) => {
                  setWizardData(oldWizardData => ({ ...oldWizardData, verificationCode: code }));
                  handleWizardAction(step.action);
                }}
                wizardId={wizardId}
              />}
              {step.type === 'plainContent' && <div>
                <AllContentRenderer
                  content={step.content}
                  hideTimestamp
                />
              </div>}
              {step.type === 'shareLink' && <WizardShareLink />}
            </Scrollable>
            {actionsArray.length > 0 && <div className='flex flex-col gap-4'>
              {actionsArray.map((action) => {
                return <Button
                  role={action.role}
                  key={action.text}
                  text={action.text}
                  onClick={() => handleWizardAction(action)}
                  disabled={action.disabled}
                />
              })}
            </div>}
          </AnimatedTabPage>;
        })}
      </AnimatedTabPageContainer>
    </Modal>
  );
};

export default React.memo(FullscreenWizard);