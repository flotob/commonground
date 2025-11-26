// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useState } from 'react';
import Button from 'components/atoms/Button/Button';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { AllContentRenderer } from 'components/molecules/MesssageBodyRenderer/MessageBodyRenderer';
import { validateEmailInput } from 'common/validators';
import { useSnackbarContext } from 'context/SnackbarContext';
import { useOwnUser } from 'context/OwnDataProvider';

type Props = {
  content: Models.Wizard.WizardElement[];
  actionBack: Models.Wizard.WizardAction;
  action: Models.Wizard.WizardAction;
  onNext: (email: string) => void;
  handleWizardAction: (action: Models.Wizard.WizardAction) => void;
};

const WizardEmailView: React.FC<Props> = ({ content, action, actionBack, onNext, handleWizardAction }) => {
  const [email, setEmail] = useState('');
  const { showSnackbar } = useSnackbarContext();
  const ownUser = useOwnUser();

  const handleNext = useCallback(() => {
    const isLoggedIn = !!ownUser;
    if (!!validateEmailInput(email) && !isLoggedIn) {
      showSnackbar({ type: 'warning', text: 'Please enter a valid email address' });
    } else {
      onNext(email);
    }
  }, [email, onNext, ownUser, showSnackbar]);

  return (<>
    <Scrollable>
      <div>
        <AllContentRenderer
          content={content}
          hideTimestamp
        />
        <TextInputField
          value={email}
          onChange={setEmail}
          placeholder='Enter your email to continue'
          onKeyPress={(e) => e.key === 'Enter' && handleNext()}
        />
      </div>
    </Scrollable>
    <div className='flex flex-col gap-4'>
      <Button
        role={actionBack.role}
        key={actionBack.text}
        text={actionBack.text}
        onClick={() => handleWizardAction(actionBack)}
        disabled={actionBack.disabled}
      />
      <Button
        role={action.role}
        key={action.text}
        text={action.text}
        onClick={handleNext}
        disabled={action.disabled}
      />
    </div>
  </>);
};

export default React.memo(WizardEmailView);