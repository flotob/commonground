// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import SparkMultiIcon from 'components/atoms/SparkMultiIcon/SparkMultiIcon';
import './EarlyAdopterBanner.css';
import React, { useEffect, useRef, useState } from 'react';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import { ReactComponent as SparkIcon } from 'components/atoms/icons/misc/spark.svg';
import Button from 'components/atoms/Button/Button';
import confetti from 'canvas-confetti';

type Props = {};

const EarlyAdopterBanner: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  return (<>
    <ScreenAwareModal
      isOpen={isOpen}
      onClose={() => setIsOpen}
      hideHeader
      customClassname='early-adopter-modal'
    >
      <div className='flex flex-col items-center gap-4 p-8 cg-text-main cg-text-lg-400'>
        <canvas ref={canvasRef} className='absolute w-full h-full top-0 left-0 cg-border-xxl pointer-events-none z-10' />
        <h2>You’ve received</h2>
        <div className='flex gap-1 items-center'>
          <SparkIcon className='w-8 h-8' />
          <h2>100.000</h2>
        </div>
        <h3 className='text-center'>As one of our early Supporters, we’re thanking you with a gift of <span className='cg-text-spark'>Spark</span></h3>
        <span className='text-center'>Use Spark to upgrade your community, donate to communities you enjoy, or become a CG Supporter</span>
        <Button
          role='primary'
          text='Claim Spark'
          onClick={() => setIsOpen(false)}
        />
      </div>
    </ScreenAwareModal>
    <div className='flex cg-simple-container cg-border-xxl p-4 items-center self-stretch cursor-pointer cg-text-main relative mx-2' onClick={() => setIsOpen(true)}>
      <div className='flex items-center justify-center w-full h-full overflow-hidden absolute left-0 top-0'>
        <div className='early-adopter-blurred-bg'>
          <SparkMultiIcon iconCount={2} />
        </div>
      </div>
      <h3 className='cg-heading-3 z-10'>We have a gift<br />for you</h3>
    </div>
  </>);
}

export default React.memo(EarlyAdopterBanner);