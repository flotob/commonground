// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { validateEmailInput } from 'common/validators';
import Button from 'components/atoms/Button/Button';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { useOwnUser } from 'context/OwnDataProvider';
import { useSnackbarContext } from 'context/SnackbarContext';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import userApi from 'data/api/user';
import loginManager from 'data/appstate/login';
import React, { useCallback, useMemo, useState } from 'react'

type Props = {
  onNext: () => void;
};

const WizardLoginFallback: React.FC<Props> = (props) => {
  const ownUser = useOwnUser();
  const { isMobile } = useWindowSizeContext();
  const [email, setEmail] = useState('');
  const [oneTimePassword, setOneTimePassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { showSnackbar } = useSnackbarContext();

  const onLogin = useCallback(async () => {
    await loginManager.login({ email, code: oneTimePassword });
  }, [email, oneTimePassword]);

  const onContinue = useCallback(async () => {
    const isEmailAvailable = await userApi.isEmailAvailable({ email });
    if (!!validateEmailInput(email) || email.length === 0) {
      showSnackbar({ type: 'warning', text: 'Please enter a valid email address' });
      return;
    }

    if (!!isEmailAvailable) {
      showSnackbar({ text: 'Email is not valid', type: 'warning' });
      return;
    }

    await userApi.sendOneTimePasswordForLogin({ email });
    setIsLoggingIn(true);
  }, [email, showSnackbar]);

  const otpScreen = useMemo(() => {
    return (<div className='fullscreen-wizard-step'>
      <div className='flex flex-col gap-8 items-center p-4'>
        <h2 className='mb-4 mt-12 text-center block'>{`An email with the password to continue was sent to ${email}`}</h2>
        <div className='flex flex-col gap-4 items-center w-full'>
          <h3>Enter the password</h3>
          <TextInputField
            value={oneTimePassword}
            onChange={setOneTimePassword}
            inputClassName='w-full'
            placeholder='Enter password'
            onKeyPress={(e) => e.key === 'Enter' && onLogin()}
          />
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <Button
          className='w-full'
          role='secondary'
          text='Go back'
          onClick={() => setIsLoggingIn(false)}
        />
        <Button
          className='w-full'
          role='primary'
          text='Continue'
          onClick={onLogin}
          disabled={oneTimePassword.length === 0}
        />
      </div>
    </div>);
  }, [email, onLogin, oneTimePassword]);

  const startOrLoginScreen = useMemo(() => {
    return (<div className='fullscreen-wizard-step'>
      <Scrollable>
        <div className={`flex flex-col justify-between gap-8 items-center`}>
          <div className='w-full flex flex-col gap-4 mt-20'>
            <h2 className='text-center'>This page is locked. If you already signed up, enter your email</h2>
          </div>
          <TextInputField
            value={email}
            onChange={setEmail}
            inputClassName='w-full'
            placeholder='Enter email'
            onKeyPress={(e) => e.key === 'Enter' && onContinue()}
          />
        </div>
        <div className={`flex flex-col gap-4 ${isMobile ? 'py-4' : 'py-8'}`}>
          <Button
            className='w-full'
            role='primary'
            text='Continue'
            onClick={onContinue}
            disabled={email.length === 0}
          />
        </div>
      </Scrollable>
    </div>);
  }, [email, isMobile, onContinue]);

  if (!!ownUser) {
    return <div className='fullscreen-wizard-step'>
      <Scrollable>
        <div className={`flex flex-col justify-between gap-8 items-center`}>
          <h2 className='text-center block mt-24'>This page is locked, unfortunately you don't have permissions to see it.</h2>
        </div>
      </Scrollable>
      <div className={`flex flex-col gap-4 ${isMobile ? 'py-4' : 'py-8'}`}>
        <Button
          className='w-full'
          role='primary'
          text='Close'
          onClick={props.onNext}
        />
      </div>
    </div>;
  } else if (isLoggingIn) {
    return otpScreen;
  } else {
    return startOrLoginScreen;
  }
}

export default React.memo(WizardLoginFallback);