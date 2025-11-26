// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useWindowSizeContext } from 'context/WindowSizeProvider';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import BottomSliderModal from '../BottomSliderModal/BottomSliderModal';
import { Popover, PopoverHandle, PopoverProps } from '../Tooltip/Tooltip';

type Props = PopoverProps & {
  floatingMode?: boolean;
  noDefaultScrollable?: boolean;
  overrideZIndex?: number;
};

const ScreenAwarePopover = forwardRef<PopoverHandle, React.PropsWithChildren<Props>>((props, ref) => {
  const { onOpen, onClose } = props;
  const { isMobile } = useWindowSizeContext();
  const [isBottomModalOpen, _setIsBottomModalOpen] = useState(false);
  const desktopRef = useRef<PopoverHandle>(null);

  const setIsBottomModalOpen = useCallback((open: boolean) => {
    _setIsBottomModalOpen(open);
    if (open) onOpen?.();
    else onClose?.();
  }, [onClose, onOpen]);

  useImperativeHandle(ref, () => ({
    open() {
      if (isMobile) {
        setIsBottomModalOpen(true);
      } else {
        desktopRef.current?.open();
      }
    },
    close() {
      if (isMobile) {
        setIsBottomModalOpen(false);
      } else {
        desktopRef.current?.close();
      }
    },
  }), [setIsBottomModalOpen, isMobile]);

  if (isMobile) {
    return <>
      <div className={props.triggerClassName} onClick={(ev) => {
        ev.stopPropagation();
        setIsBottomModalOpen(true);
      }}>
        {props.triggerContent}
      </div>
      <div onClick={(ev) => ev.stopPropagation()}>
        <BottomSliderModal
          isOpen={isBottomModalOpen}
          onClose={() => setIsBottomModalOpen(false)}
          floatingMode={props.floatingMode}
          noDefaultScrollable={props.noDefaultScrollable}
          overrideZIndex={props.overrideZIndex}
          customClassname={props.tooltipClassName}
        >
          {props.tooltipContent}
        </BottomSliderModal>
      </div >
    </>
  } else {
    return <Popover
      ref={desktopRef}
      {...props}
    />
  }
});

export default React.memo(ScreenAwarePopover);