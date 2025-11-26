// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { validateEmailInput } from 'common/validators';
import Button from 'components/atoms/Button/Button';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import WizardImage from 'components/molecules/MesssageBodyRenderer/WizardImage/WizardImage';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { useSnackbarContext } from 'context/SnackbarContext';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import communityApi from 'data/api/community';
import userApi from 'data/api/user';
import loginManager from 'data/appstate/login';
import React, { useCallback, useMemo, useState } from 'react'

type Props = {
  wizardId: string;
  onNext: (code: string) => void;
  debugMode?: boolean;
};

const WizardStartOrLogin: React.FC<Props> = (props) => {
  const { isMobile } = useWindowSizeContext();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(true);
  const [oneTimePassword, setOneTimePassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { showSnackbar } = useSnackbarContext();

  const checkCode = useCallback(() => {
    const isCodeAvailable = communityApi.wizardVerifyCode({ code, wizardId: props.wizardId });
    return isCodeAvailable;
  }, [code, props.wizardId]);

  const onLogin = useCallback(async () => {
    try {
      await loginManager.login({email, code: oneTimePassword});
      // todo get wizard data and move user to proper step
      props.onNext(code);
    } catch (e) {
      showSnackbar({ text: 'Login failed, please try again', type: 'warning' });
    }
  }, [code, email, oneTimePassword, props, showSnackbar]);

  const onContinue = useCallback(async () => {
    if (props.debugMode) props.onNext(code);

    if (!isCodeMode && email.length > 0) {
      if (!!validateEmailInput(email)) {
        showSnackbar({ type: 'warning', text: 'Please enter a valid email address' });
        return;
      }

      const isEmailAvailable = await userApi.isEmailAvailable({ email });
      if (!!isEmailAvailable) {
        showSnackbar({ text: 'Email is not valid', type: 'warning' });
        return;
      }

      await userApi.sendOneTimePasswordForLogin({ email });
      setIsLoggingIn(true);
    } else if (isCodeMode && code.length > 0) {
      const isCodeValid = await checkCode();
      if (!isCodeValid) {
        showSnackbar({ text: 'Code is not valid', type: 'warning' });
        return;
      } else {
        props.onNext(code);
      }
    }
  }, [checkCode, code, email, isCodeMode, props, showSnackbar]);

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
          <div className='w-full flex flex-col gap-4'>
            <WizardImage wizardImageId='wizard-header-1' className='w-48 h-48 mx-auto' type='wizardImage' />
            <h2 className='text-center'>Someone you trust has led you here.</h2>
            <h5 className='text-center'>That means there is a direct chain of trust over n edges between you and us.</h5>
          </div>
          <div className='flex flex-col gap-8 w-full'>
            {isCodeMode ? <div className='flex flex-col gap-4 items-center w-full'>
              <h5>Enter your code to continue</h5>
              <TextInputField
                value={code}
                onChange={setCode}
                inputClassName='w-full'
                placeholder='Enter code'
                onKeyPress={(e) => e.key === 'Enter' && onContinue()}
              />
            </div> :
            <div className='flex flex-col gap-4 items-center w-full'>
              <h5>Already joined? Enter email</h5>
              <TextInputField
                value={email}
                onChange={setEmail}
                inputClassName='w-full'
                placeholder='Enter email'
                onKeyPress={(e) => e.key === 'Enter' && onContinue()}
              />
            </div>}
          </div>
        </div>
        <div className={`flex flex-col gap-4 ${isMobile ? 'py-4' : 'py-8'}`}>
          <Button
            className='w-full'
            role='secondary'
            text={isCodeMode ? 'Coming back? Use email instead' : 'Use code instead'}
            onClick={() => setIsCodeMode(old => !old)}
          />
          <Button
            className='w-full'
            role='primary'
            text='Continue'
            onClick={onContinue}
            disabled={isCodeMode ? code.length === 0 : email.length === 0}
          />
        </div>
      </Scrollable>
    </div>);
  }, [code, email, isCodeMode, isMobile, onContinue]);

  const content = useMemo(() => {
    return isLoggingIn ? otpScreen : startOrLoginScreen;
  }, [isLoggingIn, otpScreen, startOrLoginScreen]);

  return content;
}

export default React.memo(WizardStartOrLogin);