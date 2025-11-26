// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './PremiumBox.css';
import React from 'react';

type Props = {
  className?: string;
  type2?: boolean;
  onClick?: () => void;
};

const PremiumBox: React.FC<React.PropsWithChildren<Props>> = (props) => {
  return (<div
      className={`${props.className || ''} cg-text-main premium-box${props.type2 ? ' type-2' : ''}`}
      onClick={props.onClick}
      role={props.onClick ? 'button' : undefined}
    >
    {props.children}
  </div>);
}

export default React.memo(PremiumBox);