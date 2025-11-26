// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import Sheet, { SheetRef } from 'react-modal-sheet'
import Scrollable from 'components/molecules/Scrollable/Scrollable';

import './BottomSliderModal.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customClassname?: string;
  hideMobileHandler?: boolean;
  noDefaultScrollable?: boolean;
  floatingMode?: boolean;

  overrideZIndex?: number;
  footerActions?: JSX.Element;
}

const BottomSliderModal: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const { isOpen, onClose, customClassname, children, hideMobileHandler, noDefaultScrollable, floatingMode } = props;
  const ref = React.useRef<SheetRef>();

  const className = [
    'bottom-slider-modal-container',
    customClassname || '',
    hideMobileHandler ? 'header-hidden' : '',
    floatingMode ? 'floating-mode' : 'full-mode'
  ].join(' ').trim();

  let content: React.ReactNode;
  if (noDefaultScrollable) {
    content = children;
  } else {
    content = <Scrollable innerClassName='pb-4'>
      {children}
    </Scrollable>;
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      ref={ref}
      detent='content-height'
      className={className}
      style={{ zIndex: props.overrideZIndex || 1000 }}
    >
      <Sheet.Container>
        {!hideMobileHandler && <Sheet.Header />}
        <Sheet.Content>
          <Sheet.Scroller>
            {content}
            {props.footerActions && <div className='flex justify-center p-2'>
              {props.footerActions}
            </div>}
          </Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  )
}

export default BottomSliderModal