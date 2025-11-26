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
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';

type Props = {
  content: Models.Wizard.WizardElement[];
  checkboxText: string;
  action: Models.Wizard.WizardAction;
  stepId: number;
  onNext: () => void;
};

const WizardConfirmCheckboxView: React.FC<Props> = ({ content, action, checkboxText, stepId, onNext }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState('');
  const { showSnackbar } = useSnackbarContext();
  const { setWizardStepData } = useCommunityWizardContext();

  const handleNext = useCallback(async () => {
    if (!isChecked || !name) {
      showSnackbar({ type: 'warning', text: 'Please fill the form to proceed' });
    } else {
      await setWizardStepData(stepId, { type: 'ndaAccepted', name, ndaAcceptedChecked: true });
      onNext();
    }
  }, [isChecked, name, onNext, showSnackbar, setWizardStepData, stepId]);

  return (
    <>
      <Scrollable alwaysVisible>
        <div>
          <AllContentRenderer
            content={content}
            hideTimestamp
          />
        </div>
      </Scrollable>
      <div className='flex flex-col gap-4'>
        <div className='w-full'>
          <TextInputField
            type='text'
            value={name}
            onChange={setName}
            placeholder={`Your name`}
          />
        </div>
        <div className='flex py-2 px-4 cursor-pointer justify-between items-center gap-4 cg-border-secondary cg-border-xl wizard-text-active-reddish' onClick={() => setIsChecked(old => !old)}>
          <h4>{checkboxText}</h4>
          <CheckboxBase
            type='checkbox'
            size='large'
            checked={isChecked}
          />
        </div>
        <Button
          role={action.role}
          key={action.text}
          text={action.text}
          onClick={handleNext}
          disabled={!isChecked || !name}
        />
      </div>
    </>
  );
};

export default React.memo(WizardConfirmCheckboxView);