// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import { ReactComponent as WizardImage1 } from './wizard-image-1.svg';
import { ReactComponent as WizardImage2 } from './wizard-image-2.svg';
import { ReactComponent as WizardNumbers } from './wizard-numbers.svg';
import wizardHeader1 from './wizard-header-1.webp';
import wizardHeader2 from './wizard-header-2.webp';
import wizardHeader3 from './wizard-header-3.webp';
import wizardHeader4 from './wizard-header-4.png';
import wizardHeader5 from './wizard-header-5.webp';
import wizardHeader6 from './wizard-header-6.webp';
import { SealCheck } from '@phosphor-icons/react';

type Props = Common.Content.WizardImage;

const WizardImage: React.FC<Props> = (props) => {
  switch (props.wizardImageId) {
    case 'wizard-image-1': return <WizardImage1 className={`cg-text-main ${props.className || ''}`} />;
    case 'wizard-image-2': return <WizardImage2 className={`cg-text-main ${props.className || ''}`} />;
    case 'wizard-numbers': return <WizardNumbers className={`cg-text-main ${props.className || ''}`} />;
    case 'wizard-header-1': return <img src={wizardHeader1} alt="wizard-header-1" className={props.className} />;
    case 'wizard-header-2': return <img src={wizardHeader2} alt="wizard-header-2" className={props.className} />;
    case 'wizard-header-3': return <img src={wizardHeader3} alt="wizard-header-3" className={props.className} />;
    case 'wizard-header-4': return <img src={wizardHeader4} alt="wizard-header-4" className={props.className} />;
    case 'wizard-header-5': return <img src={wizardHeader5} alt="wizard-header-5" className={props.className} />;
    case 'wizard-header-6': return <img src={wizardHeader6} alt="wizard-header-6" className={props.className} />;
    case 'sealCheck': return <SealCheck className={props.className} weight='fill' />;
    default: return <div>Unknown Image</div>;
  }
}

export default React.memo(WizardImage);