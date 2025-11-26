// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react'

type Props = {
  currentScreen: string | number;
  screenOrder: Record<string | number, number>;
  className?: string;
}

const AnimatedTabPageContainer: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const {
    currentScreen,
    screenOrder,
    className: containerClassName,
    children
  } = props;

  const [lastScreen, setLastScreen] = useState(currentScreen);
  const [currentDirection, setCurrentDirection] = useState<'normal' | 'reversed'>('normal');

  if (currentScreen !== lastScreen) {
    const lastValue = screenOrder[lastScreen] || 0;
    const currentValue = screenOrder[currentScreen] || 0;

    setLastScreen(currentScreen);
    setCurrentDirection(lastValue > currentValue ? 'reversed' : 'normal');
  }

  const className = [
    'animated-tab-page-container',
    currentDirection,
    containerClassName || ''
  ].join(' ');

  return (<div className={className}>
    {children}
  </div>);
}

export default React.memo(AnimatedTabPageContainer);