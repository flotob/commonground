// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'components/atoms/Button/Button';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { AllContentRenderer } from 'components/molecules/MesssageBodyRenderer/MessageBodyRenderer';
import { investmentTargets } from 'common/investmentTargets';
import communityApi from 'data/api/community';
import { useAsyncMemo } from 'hooks/useAsyncMemo';
import { formatUnits } from 'ethers/lib/utils';
import { useCommunityWizardContext } from 'context/CommunityWizardProvider';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { CheckCircleIcon, DocumentIcon } from '@heroicons/react/20/solid';
import { useSnackbarContext } from 'context/SnackbarContext';
import urlConfig from '../../../data/util/urls';
import shortUUID from 'short-uuid';
import config from 'common/config';

const t = shortUUID();

type Props = {
  sections: Models.Wizard.WizardSection[];
  actions: Models.Wizard.WizardAction[];
  handleWizardAction: (action: Models.Wizard.WizardAction) => void;
  investmentTarget?: Models.Wizard.ValidInvestmentTarget;
}

const WizardDataRoom: React.FC<Props> = (props) => {
  const { showSnackbar } = useSnackbarContext();
  const { wizard } = useCommunityWizardContext();
  const { community } = useLoadedCommunityContext();
  const [updateProgressCounter, setUpdateProgressCounter] = useState(0);

  const saleData = useMemo(() => {
    return props.investmentTarget ? investmentTargets[props.investmentTarget] : undefined;
  }, [props.investmentTarget]);

  const handleSectionAction = useCallback((action: 'openLink' | 'openGatedFileDownload', linkOrFilename: string) => {
    if (action === 'openLink') {
      window.open(linkOrFilename, '_blank', 'noopener,noreferrer');
    } else if (action === 'openGatedFileDownload') {
      window.open(`${urlConfig.API_BASE_URL}/gated-files/${encodeURIComponent(linkOrFilename)}`, '_blank', 'noopener,noreferrer');
    }
  }, [community.url]);

  const saleBalance = useAsyncMemo(async () => {
    if (!props.investmentTarget) {
      return undefined;
    }
    return communityApi.wizardGetInvestmentTargetBeneficiaryBalance({ target: props.investmentTarget });
  }, [props.investmentTarget, updateProgressCounter]);

  const ownContribution = useAsyncMemo(async () => {
    return (await communityApi.wizardGetInvestmentTargetPersonalContribution({ target: props.investmentTarget! })).contribution;
  }, [props.investmentTarget]);

  const maxProgress = useMemo(() => {
    if (!saleBalance || !saleData) {
      return 1;
    }
    return parseFloat(saleData.hardCap);
  }, [saleBalance, saleData]);

  const progress = useMemo(() => {
    if (!saleBalance || !saleData) {
      return 1;
    }
    return parseFloat(formatUnits(saleBalance.balance, saleData.decimals));
  }, [saleBalance, saleData]);

  const referralCodeWizardId = useMemo(() => {
    const dataRoomStep = wizard?.steps.find(step => step.type === 'dataRoom') as (Models.Wizard.WizardStep & { type: 'dataRoom' }) | undefined;
    const referralCodesSection = dataRoomStep?.sections.find(section => section.type === 'referralCodes') as (Models.Wizard.WizardSection & { type: 'referralCodes' }) | undefined;
    return referralCodesSection?.wizardId;
  }, [wizard]);

  const myReferralCodes = useAsyncMemo(async () => {
    if (!referralCodeWizardId) {
      return [];
    }
    return (await communityApi.wizardGetMyReferralCodes({ wizardId: referralCodeWizardId })).referralCodes;
  }, [referralCodeWizardId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateProgressCounter(value => value + 1);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const softCapString = useMemo(() => {
    if (!saleData) {
      return '';
    }
    let agg: '' | 'K' | 'M' | 'B' = '';
    let num = parseFloat(saleData.softCap);
    if (num >= 1000000) {
      agg = 'M';
      num /= 1000000;
    } else if (num >= 1000) {
      agg = 'K';
      num /= 1000;
    }
    return `${num.toLocaleString()}${agg}`;
  }, [saleData]);

  const hardCapString = useMemo(() => {
    if (!saleData) {
      return '';
    }
    let agg: '' | 'K' | 'M' | 'B' = '';
    let num = parseFloat(saleData.hardCap);
    if (num >= 1000000) {
      agg = 'M';
      num /= 1000000;
    } else if (num >= 1000) {
      agg = 'K';
      num /= 1000;
    }
    return `${num.toLocaleString()}${agg}`;
  }, [saleData]);

  if (!saleData || !props.investmentTarget) {
    return (
      <div className='fullscreen-wizard-step flex flex-col gap-4'>
        <div className='cg-text-warning'>
          No sale data found for this investment target, or no investment target set.
        </div>
      </div>
    );
  }

  return (<div className='fullscreen-wizard-step flex flex-col gap-4'>
    <Scrollable alwaysVisible>
      <div style={{ paddingBottom: `${props.actions.length * 43.5 + (props.actions.length - 1) * 8 + 32 + 8}px`, paddingTop: '2rem' }}>
        {props.sections.map((section, index) => {
          if (section.type === 'imageButtonHeader') {
            return <div className='flex justify-between gap-4 w-full'>
              <img src={section.imageUri} alt='header' className='w-1/4' />
              <Button
                role='primary'
                text={section.buttonTitle}
                onClick={() => handleSectionAction('openLink', section.buttonUrl)}
              />
            </div>;
          } else if (section.type === 'plainContent') {
            return <AllContentRenderer
              key={index}
              content={section.content}
              hideTimestamp
            />
          } else if (section.type === 'graph') {
            return <div className='flex flex-col gap-2 my-4'>
              <ul style={{
                listStyleType: 'disc',
                listStylePosition: 'outside',
                padding: 0,
                marginLeft: '18px',
                fontSize: '0.8rem',
              }}>
                <li>{!ownContribution || ownContribution === '0' ? 'You have not invested yet' : `You have invested $${Math.floor(parseFloat(formatUnits(BigInt(ownContribution || '0'), saleData.decimals))).toLocaleString()}`}</li>
                <li>Soft cap: {softCapString} / Hard cap: {hardCapString}</li>
              </ul>
              <ProgressBar
                softCap={parseFloat(saleData.softCap)}
                hardCap={parseFloat(saleData.hardCap)}
                current={progress}
              />
            </div>;
          } else if (section.type === 'referralCodes') {
            return <div className='flex flex-col gap-2 items-center my-4'>
              {myReferralCodes?.map((item, index) => {
                return <div className='w-full flex cg-bg-subtle items-center justify-between py-3 px-4 cg-border-xxl wizard-max-wizard-420 h-16' key={item.code}>
                  <h3 className={item.used ? 'cg-text-secondary line-through' : undefined}>{item.code}</h3>
                  {item.used ? <div className='flex gap-1 items-center cg-text-success'>
                    <CheckCircleIcon className='h-5 w-5' />
                    <h3>Claimed</h3>
                  </div> : <Button
                    role='chip'
                    text='Copy'
                    iconLeft={<DocumentIcon className='w-5 h-5' />}
                    onClick={() => {
                      const text = `You are invited to a private investment round.\n\nGo to ${window.location.origin}/${config.URL_COMMUNITY}/${community.url}/${config.URL_WIZARD}/${t.fromUUID(referralCodeWizardId!)} \nUse your unique code ${item.code}`;
                      navigator.clipboard.writeText(text);
                      showSnackbar({ type: 'success', text: 'Access code copied to clipboard' });
                    }}
                  />}
                </div>
              })}
            </div>;
          } else if (section.type === 'buttons') {
            return (<div className={`flex flex-col gap-4 ${!!section.className ? section.className : ''}`} key={index}>
              <h2>{section.title}</h2>
              {section.sectionActions.map((action, index) => {
                return <Button
                  key={index}
                  role='secondary'
                  text={action.text}
                  onClick={() => handleSectionAction(action.action, 'link' in action ? action.link : action.filename)}
                />
              })}
            </div>);
          }
          else return <div className='cg-text-warning'>
            Unknown element
          </div>;
        })}
      </div>
    </Scrollable>
    {props.actions.length > 0 && <div className='absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-4'>
      {props.actions.map((action, index) => {
        return <Button
          key={index}
          role={action.role}
          text={action.text}
          onClick={() => props.handleWizardAction(action)}
          disabled={action.disabled}
        />
      })}
    </div>}
  </div>);
};

interface ProgressBarProps {
  current: number;
  softCap: number;
  hardCap: number;
  fillColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  softCap,
  hardCap,
}) => {
  const currentPercentage = (current / hardCap) * 100;
  const softCapPercentage = (softCap / hardCap) * 100;

  let fillColor = '#4CAF50';
  if (currentPercentage < softCapPercentage) {
    fillColor = 'color(display-p3 0.8353 0.0627 0.0275)';
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: `${currentPercentage}%`,
            backgroundColor: fillColor,
            height: '24px',
            borderRadius: '4px',
            transition: 'width 0.3s ease-in-out'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${softCapPercentage}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'black'
          }}
        />
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'end',
          marginTop: '4px',
          fontSize: '0.8em',
          position: 'relative',
        }}
      >
        <span style={{
          position: 'absolute',
          left: `0%`,
        }}>${Math.floor(current).toLocaleString()} raised so far</span>
        <span style={{
          position: 'absolute',
          left: `${softCapPercentage}%`,
          transform: 'translateX(-50%)',
        }}>Soft Cap</span>
        <span>Hard Cap</span>
      </div>
    </>
  );
};

export default WizardDataRoom;
