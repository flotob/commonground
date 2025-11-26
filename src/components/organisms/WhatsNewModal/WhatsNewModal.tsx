// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './WhatsNewModal.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';
import Button from 'components/atoms/Button/Button';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import { XMarkIcon } from '@heroicons/react/24/solid';
import useLocalStorage from 'hooks/useLocalStorage';
import { isLocalUrl } from 'components/atoms/SimpleLink/SimpleLink';
import { useNavigate } from 'react-router-dom';

type Props = {
}

const updateUrl = 'https://app.cg/c/commonground/article/update-10th-aug-xta7DKrvuUDpDdneGpKQxQ/';

const WhatsNewModal: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useLocalStorage(true, 'whats-new-visible');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (open === true) {
        console.log(videoRef.current);
        videoRef.current?.play();
      }
    }, 200);
  }, [open]);

  const navigateToUrl = useCallback(() => {
    const targetLocalPath = isLocalUrl(updateUrl);
    if (targetLocalPath) {
      navigate(targetLocalPath);
    } else {
      window.open(updateUrl, 'infoTab', 'noopener');
    }

    setOpen(false);
    setIsVisible(false);
  }, [navigate, setIsVisible]);

  // FIXME: uncomment if you want it to work
  // if (!isVisible) return null;
  return null;

  return (<>
    <div className='whats-new-modal-card'>
      <div className='flex gap-2 cg-text-main cg-text-lg-400'>
        <span className='flex-1'>Our biggest ever update is live 🎉</span>
        <XMarkIcon className='w-6 h-6 cg-text-secondary cursor-pointer' onClick={() => setIsVisible(false)} />
      </div>
      <Button
        role='primary'
        text="What's new"
        className='justify-between'
        iconRight={<ArrowUpRightIcon className='w-5 h-5' />}
        onClick={() => setOpen(true)}
      />
    </div>
    <ScreenAwareModal
      isOpen={open}
      onClose={() => setOpen(false)}
      hideHeader
      customClassname='whats-new-modal'
    >
      <video src='/video/update.mov' ref={videoRef} />
      <div className='flex flex-col gap-4 p-4'>
        <div className='flex flex-col'>
          <span className='cg-text-lg-500 cg-text-main'>New update!</span>
          <span className='cg-text-lg-400 cg-text-main'>The app is now 10x faster. Seriously. Read the full update notes, it’s going to blow your mind.</span>
        </div>
        <div className='flex items-center justify-center gap-4'>
          <Button text='Not now' role='secondary' onClick={() => setOpen(false)} />
          <Button text='Read update' role='primary' onClick={navigateToUrl} />
        </div>
      </div>
    </ScreenAwareModal>
  </>);
}

export default React.memo(WhatsNewModal);