// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useEffect, useState, useCallback } from "react";

import data from "data";
import { validateEmailInput } from "common/validators";

import Button from "components/atoms/Button/Button";
import CollapsableGroup from "components/molecules/CollapsableGroup/CollapsableGroup";
import CollapsableElement from "components/atoms/CollapsableElement/CollapsableElement";
import RadioButton from "components/atoms/RadioButton/RadioButton";
import TextInputField from "components/molecules/inputs/TextInputField/TextInputField";

import "./NewsletterSubscription.css";

type Props = {
    handleOnboardingClose: () => void;
}

export default function NewsletterSubscription(props: Props) {
    const { handleOnboardingClose } = props;

    const [isNewsletterSubsriptionExpanded, setIsNewsletterSubsriptionExpanded] = useState<boolean>(true);
    const [isNoThanksExpanded, setIsNoThanksExpanded] = useState<boolean>(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>();
    const [finishOnboarding, setFinishOnboarding] = useState(false);

    const onClose = useCallback(async () => {
        if (isNewsletterSubsriptionExpanded) {
            try {
                await data.user.updateOwnData({ email });
                handleOnboardingClose();
            } catch (e) {
                setEmailError('Cannot subscribe you for technical reasons')
            }
        } else {
            handleOnboardingClose();
        }
    }, [isNewsletterSubsriptionExpanded, email, handleOnboardingClose]);
  
    useEffect(() => {
        setEmailError(validateEmailInput(email));
    }, [email]);

    useEffect(() => {
        if (isNewsletterSubsriptionExpanded && !!email && !emailError) {
            setFinishOnboarding(true);
        } else if (isNoThanksExpanded) {
            setFinishOnboarding(true);
        } else {
            setFinishOnboarding(false);
        }
    }, [isNewsletterSubsriptionExpanded, email, isNoThanksExpanded, emailError]);
    

    return (
        <>
            <h3 className="modal-title">Welcome to Common Ground</h3>

            <div className="user-onboarding-success">
                <div className='success-notification-selector'>
                    <label>Stay informed</label>
                    <CollapsableGroup>
                        <CollapsableElement
                            key='newsletter'
                            state={'expanded'}
                            trigger={<RadioButton label="Join the newsletter" checked={isNewsletterSubsriptionExpanded} setChecked={(checked: boolean) => { setIsNewsletterSubsriptionExpanded(checked); setIsNoThanksExpanded(!checked); }} />}
                            view={<div className='success-newsletter-subscriber'>
                                <div className="hint">Get an email whenever we add new features</div>
                                <label>Your email*</label>
                                <TextInputField
                                    placeholder='Email'
                                    value={email}
                                    onChange={setEmail}
                                    error={emailError}
                                />
                            </div>}
                        />
                        <CollapsableElement
                            key='nothanks'
                            state={'collapsed'}
                            trigger={<RadioButton label="No thanks" checked={isNoThanksExpanded} setChecked={(checked: boolean) => { setIsNoThanksExpanded(checked); setIsNewsletterSubsriptionExpanded(!checked); }} />}
                        />
                    </CollapsableGroup>
                </div>

            </div>
            <div className='user-onboarding-footer'>
                <Button role="primary" text="Close" disabled={!finishOnboarding} onClick={() => onClose()} />
            </div>
        </>
    )
}