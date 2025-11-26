// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import data from 'data';
import TextInputField from '../inputs/TextInputField/TextInputField';
import Button from '../../../components/atoms/Button/Button';

import './NewsletterSubscribeInput.css';
import { useOwnUser } from 'context/OwnDataProvider';

const NewsletterSubscribeInput = () => {
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'loading' | 'error' | 'finished'>('idle');
  const ownUser = useOwnUser();

  const submit = React.useCallback(async () => {
    setState('loading');
    try {
      await data.user.subscribeNewsletter(email);
    } catch (e) {
      setState('error');
      return;
    }

    setState('finished');
  }, [email]);

  const handleKeyPress = React.useCallback((ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      submit();
    }
  }, [submit]);

  if (ownUser?.email) return null;

  if (state === 'finished') {
    return <div className='newsletterSubscribeContainer'>
      <div className='newsletterSubscribeHeader'>
        <span>Thanks for signing up!<br/>Unsubscribe anytime in your profile settings.</span>
      </div>
    </div>;
  }

  return (
    <div className='newsletterSubscribeContainer'>
      <div className='newsletterSubscribeHeader'>
        <span>Join our newsletter - learn about new features & get allowlisted for future airdrops</span>
      </div>
      <div className='newsletterSubscribeInputContainer'>
        <TextInputField placeholder='Your E-Mail' onKeyPress={handleKeyPress} inputClassName='newsletterSubscribeInput' value={email} onChange={setEmail} />
        <Button loading={state === 'loading'} onClick={submit} className='newsletterSubscribeButton' text='Subscribe' role='secondary' />
      </div>
      {state !== 'error' && <span className='newsletterSubscribeSubtitle'>No spam. Only nice things.</span>}
      {state === 'error' && <span className='newsletterSubscribeSubtitle error'>Failed to subscribe. Please verify that the email address is valid, or try again later.</span>}
    </div>
  )
}

export default React.memo(NewsletterSubscribeInput);