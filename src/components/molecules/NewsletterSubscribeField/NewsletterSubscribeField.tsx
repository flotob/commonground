// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import data from 'data';
import Button from '../../../components/atoms/Button/Button';
import TextInputField from '../inputs/TextInputField/TextInputField';

import './NewsletterSubscribeField.css';
import { useOwnUser } from 'context/OwnDataProvider';

type Props = {
  registerAsNewUser?: boolean;
};

const NewsletterSubscribeField: React.FC<Props> = () => {
  const ownUser = useOwnUser();

  const [email, setEmail] = React.useState(ownUser?.email || '');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const isSubscribed = ownUser?.newsletter;

  const onButtonClick = React.useCallback(async () => {
    try {
      setIsLoading(true);
      if (isSubscribed) {
        await data.user.unsubscribeNewsletter(email);
      } else {
        await data.user.subscribeNewsletter(email);
      }
    } catch (e) {
      setIsLoading(false);
      setError(`Failed to ${isSubscribed ? 'unsubscribe' : 'subscribe'}. Please verify that the email address is valid, or try again later.`);
      return;
    }

    setIsLoading(false);
    setError('');
    setSuccess(isSubscribed ? 'Unsubscribed' : 'Subscribed');
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  }, [email, isSubscribed]);

  const buttonText = isSubscribed ? 'Unsubscribe' : 'Subscribe';
  const buttonRole = isSubscribed ? 'secondary' : 'primary';

  return (
    <div className='newsletterSubscribeFieldContainer'>
        <div className='newsletterSubscribeField'>
        <TextInputField placeholder="Your E-Mail" value={email} onChange={setEmail} disabled={isSubscribed} />
        <Button loading={isLoading} text={buttonText} role={buttonRole} onClick={onButtonClick} />
      </div>
      {error && <span className='newsletterSubscribeFieldError'>{error}</span>}
      {success && <span className='newsletterSubscribeFieldSuccess'>{success}</span>}
    </div>
  )
}

export default React.memo(NewsletterSubscribeField);