// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import './UserOnboarding.css';
import { ReactComponent as FuelIcon } from 'components/atoms/icons/24/Fuel.svg';
import { ReactComponent as LuksoIcon } from 'components/atoms/icons/24/Lukso.svg';
import { ReactComponent as CircleLogo } from "components/atoms/icons/misc/Logo/logo.svg";
import PowershiftIcon from 'components/atoms/icons/externals/powershift.png';
import { useEcosystemContext } from 'context/EcosystemProvider';

const OnboardingLogo = () => {
  const { ecosystem } = useEcosystemContext();
  switch (ecosystem) {
    case 'fuel':
      return (<FuelIcon className='user-onboarding-logo'/>);
    case 'lukso':
      return (<LuksoIcon className='user-onboarding-logo'/>);
    case 'powershift':
      return (<img src={PowershiftIcon} alt='powershift' className='user-onboarding-logo dark-bg object-contain cg-circular'/>)
    default:
      return (<CircleLogo className='user-onboarding-logo'/>);
  }
}

export default React.memo(OnboardingLogo);