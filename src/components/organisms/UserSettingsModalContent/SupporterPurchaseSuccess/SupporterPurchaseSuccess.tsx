// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import Jdenticon from 'components/atoms/Jdenticon/Jdenticon';
import ToggleInputField from 'components/molecules/inputs/ToggleInputField/ToggleInputField';
import SupporterScreen from 'components/organisms/SupporterScreen/SupporterScreen';
import { useOwnUser } from 'context/OwnDataProvider';
import { useUserSettingsContext } from 'context/UserSettingsProvider';
import dayjs from 'dayjs';
import { usePremiumTier } from 'hooks/usePremiumTier';
import React, { useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';

const SupporterPurchaseSuccess = () => {
  const { setCurrentPage } = useUserSettingsContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    setTimeout(() => {
      if (canvas) {
        const createdConfetti = confetti.create(canvas, { resize: true });
        createdConfetti({
          spread: 180,
          origin: { y: 0.1 },
          startVelocity: 20,
        });
      }
    }, 50);
  }, []);

  return <div className='flex flex-col gap-4 cg-text-main cg-text-lg-400 px-4'>
    <canvas ref={canvasRef} className='absolute w-full h-full top-0 left-0 pointer-events-none z-10' />
    <SupporterScreen />
    <Button
      className='w-full'
      role='primary'
      text='Done'
      onClick={() => setCurrentPage('home')}
    />
  </div>;
}

export default React.memo(SupporterPurchaseSuccess);