// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useState } from 'react';
import Button from 'components/atoms/Button/Button';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { AllContentRenderer } from 'components/molecules/MesssageBodyRenderer/MessageBodyRenderer';
import { useSnackbarContext } from 'context/SnackbarContext';
import CheckboxBase from 'components/atoms/CheckboxBase/CheckboxBase';
import { useCommunityWizardContext } from 'context/CommunityWizardProvider';

type Props = {
  content: Models.Wizard.WizardElement[];
  checkboxText: string;
  action: Models.Wizard.WizardAction;
  stepId: number;
  onNext: () => void;
};

const WizardAmericanConfirmCheckboxView: React.FC<Props> = ({ content, action, checkboxText, stepId, onNext }) => {
  const [isAmerican, setIsAmerican] = useState<boolean | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const { showSnackbar } = useSnackbarContext();
  const { setWizardStepData } = useCommunityWizardContext();

  const handleNext = useCallback(async () => {
    if (isAmerican === null) {
      showSnackbar({ type: 'warning', text: 'Please pick an option' });
    } else if (isAmerican && !isChecked) {
      showSnackbar({ type: 'warning', text: 'Please confirm to proceed' });
    } else {
      await setWizardStepData(stepId, { type: 'americanSelfCertification', isAmerican, isAccredited: isChecked });
      onNext();
    }
  }, [isAmerican, isChecked, onNext, showSnackbar]);

  return (
    <>
      <Scrollable alwaysVisible>
        <div className='flex flex-col gap-4 mt-8'>
          <div className='flex flex-col gap-2'>
            <h2>Self-Certification for American Investors</h2>
          </div>
          <div className='flex gap-2 p-2 cursor-pointer' onClick={() => setIsAmerican(false)}>
            <CheckboxBase size='normal' type='radio' checked={isAmerican === false} />
            <h5>🌍 I'm not a US citizen</h5>
          </div>
          <div className='flex gap-2 p-2 cursor-pointer' onClick={() => setIsAmerican(true)}>
            <CheckboxBase size='normal' type='radio' checked={isAmerican === true} />
            <h5>🇺🇸 I'm a US citizen</h5>
          </div>
          {!!isAmerican && <AllContentRenderer
            content={content}
            hideTimestamp
          />}
        </div>
      </Scrollable>
      <div className='flex flex-col gap-4'>
        {!!isAmerican && <div className='flex py-2 px-4 cursor-pointer justify-between items-center gap-4 cg-border-secondary cg-border-xl wizard-text-active-reddish' onClick={() => setIsChecked(old => !old)}>
          <h4>{checkboxText}</h4>
          <CheckboxBase
            type='checkbox'
            size='large'
            checked={isChecked}
          />
        </div>}
        <Button
          role={action.role}
          key={action.text}
          text={action.text}
          onClick={handleNext}
          disabled={isAmerican === null || (isAmerican && !isChecked)}
        />
      </div>
    </>
  );
};

export default React.memo(WizardAmericanConfirmCheckboxView);