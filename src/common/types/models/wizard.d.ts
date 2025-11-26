// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
    namespace Wizard {
        type WizardElement =
            Common.Content.Text |
            Common.Content.Newline |
            Common.Content.Link |
            Common.Content.RichTextLink |
            Common.Content.ArticleImage |
            Common.Content.DynamicTextFunction |
            Common.Content.DynamicTextRequest |
            Common.Content.WizardImage |
            Common.Content.ArticleEmbed |
            Common.Content.InlineImage |
            Common.Content.NativeVideoEmbed |
            Common.Content.NativeDownloadEmbed;

        type ValidInvestmentTarget = "sale01";

        type WizardNavigate = {
            type: 'step';
            stepId: number;
        } | {
            type: 'wizard';
            wizardId: string;
        } | {
            type: 'openLink';
            link: string;
        } | {
            type: 'close';
        };

        type WizardAction = {
            text: string;
            role: ButtonRole;
            disabled?: boolean;
            action: {
                type: 'goto';
                navigate: WizardNavigate;
            } | {
                type: 'sendPayment' | 'createAccount' | 'success' | 'failure';
            };
        };

        type WizardSection = {
            type: 'imageButtonHeader';
            imageUri: string;
            buttonTitle: string;
            buttonUrl: string;
        } | {
            type: 'plainContent';
            content: WizardElement[];
        } | {
            type: 'graph';
        } | {
            type: 'referralCodes';
            wizardId: string;
        } | {
            type: 'buttons'
            title: string;
            className?: string;
            sectionActions: ({
                text: string;                
            } & ({
                action: 'openLink';
                link: string;
            } | {
                action: 'openGatedFileDownload';
                filename: string;
            }))[];
        }

        type WizardStep = {
            stepId: number;
        } & ({
            type: 'plainContent';
            content: WizardElement[];
            actions: WizardAction[];
        } | {
            type: 'emailView';
            content: WizardElement[];
            actionBack: WizardAction;
            action: WizardAction;
        } | {
            type: 'dataRoom';
            sections: WizardSection[];
            actions: WizardAction[];
        } | {
            type: 'ndaConfirmCheckboxView';
            content: WizardElement[];
            action: WizardAction;
            checkboxText: string;
        } | {
            type: 'americanConfirmCheckboxView';
            content: WizardElement[];
            action: WizardAction;
            checkboxText: string;
        } | {
            type: 'invest';
            target: ValidInvestmentTarget;
            action: WizardAction;
            alreadyInvestedBefore?: boolean;
        } | {
            type: 'startOrLogin' | 'OGView' | 'shareLink' | 'loginFallback';
            action: WizardAction;
        } | {
            type: 'kyc';
            actions: WizardAction[];
        });

        type WizardSuccessCondition = {
            type:
                'kycLiveness' |
                'kycFull' |
                'kycCgTokensale' |
                'redeemedCode' |
                'invested' |
                'step_ndaAccepted' |
                'step_investorDetailsFilled' |
                'step_americanSelfCertification';
        } | {
            type: 'maxWizardAge';
            seconds: number;
        };

        type WizardSuccessAction = {
            type: 'gainRole';
            roleId: string;
        } | {
            type: 'joinWizardCommunity';
        } | {
            type: 'generateCodes';
            numberOfCodes: number;
            wizardId: string;
        };

        type Wizard = {
            steps: WizardStep[];
            successActions: WizardSuccessAction[];
            successConditions: WizardSuccessCondition[];
            onSuccessNavigate: WizardNavigate & { type: Exclude<WizardNavigate["type"], "step"> };
            onFailureNavigate: WizardNavigate & { type: Exclude<WizardNavigate["type"], "step"> };
            successfulUsers: number;
            failedUsers: number;
            successLimit?: number;
            investmentTarget?: ValidInvestmentTarget;
            socialPreviewDescription?: string;
        };

        type WizardStepData = ({
            type: 'ndaAccepted';
            name: string;
            ndaAcceptedChecked: true;
            serverTimestamp?: number;
        } | {
            type: 'investorDetailsFilled';
            name: string;
            address: string;
            isLegalEntity: boolean;
            serverTimestamp?: number;
        } | {
            type: 'americanSelfCertification';
            isAmerican: boolean;
            isAccredited: boolean;
            serverTimestamp?: number;
        });

        type WizardUserData = {
            state: 'active' | 'success' | 'failed';
            stepData: Record<`${number}`, WizardStepData>;
        };
    }
}