// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import Dropdown, { Props } from '../../molecules/Dropdown/Dropdown';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import BottomSliderModal from '../BottomSliderModal/BottomSliderModal';

import './ScreenAwareDropdown.css';
import { PopoverHandle } from '../Tooltip/Tooltip';

type ScreenAwareDropdownProps = Props & {
  overrideZIndex?: number;
};

const ScreenAwareDropdown = forwardRef<PopoverHandle, React.PropsWithChildren<ScreenAwareDropdownProps>>((props, ref) => {
  const { isMobile } = useWindowSizeContext();
  const desktopRef = useRef<PopoverHandle>(null);
  const mobileRef = useRef<PopoverHandle>(null);

  useImperativeHandle(ref, () => ({
    open() {
      if (isMobile) mobileRef.current?.open();
      else desktopRef.current?.open();
    },
    close() {
      if (isMobile) mobileRef.current?.close();
      else desktopRef.current?.close();
    },
  }), [isMobile]);

  if (isMobile) {
    return <MobileDropdown {...props} ref={mobileRef} />
  } else {
    return <Dropdown {...props} ref={desktopRef} />
  }
});

const MobileDropdown = forwardRef<PopoverHandle, React.PropsWithChildren<ScreenAwareDropdownProps>>((props, ref) => {
  const [isOpen, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
  }), []);

  return <>
    <div className={props.triggerClassname} onClick={() => setOpen(true)}>
      {props.triggerContent}
    </div>
    <BottomSliderModal
      overrideZIndex={props.overrideZIndex}
      isOpen={isOpen}
      onClose={() => setOpen(false)}
    >
      <div onClick={() => setOpen(false)}>
        {props.items}
      </div>
    </BottomSliderModal>
  </>
});

export default React.memo(ScreenAwareDropdown);