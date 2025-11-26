// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Button from 'components/atoms/Button/Button'
import Modal from 'components/atoms/Modal/Modal'
import { Tooltip } from 'components/atoms/Tooltip/Tooltip'
import { useWindowSizeContext } from 'context/WindowSizeProvider'
import React from 'react'

type Props = {
  url: string;
  isVisible: boolean;
  onClose: () => void;
}

const ExternalLinkModal: React.FC<Props> = (props) => {
  const { isVisible, url: originalUrl, onClose } = props;
  const { isMobile } = useWindowSizeContext();

  let url = originalUrl;
  if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
    url = 'https://' + url;
  }

  const continueToExternalLink = () => {
    window.open(url, '_blank', 'noreferrer')?.focus();
    onClose();
  }

  if (!isVisible) return null;

  return (<Modal
    modalInnerClassName="simple-link-modal"
    headerText="You are opening a link in a new tab"
    close={onClose}
  >
    <div className="modal-inner">
      <div>
        <p>This link is taking you to another site:</p>
        <p className='link'>{url}</p>
        <p>Are you sure you want to continue?</p>
      </div>
      <div className="simple-link-modal-footer mt-6">
        <Tooltip
          placement="bottom"
          triggerContent={
            <Button
              className="simple-link-modal-tag"
              role="admin"
              text={isMobile ? "" : "Why am I seeing this"}
              iconLeft={<QuestionMarkCircleIcon className='w-5 h-5' />}
            />
          }
          tooltipContent="The internet is a dangerous place. This link leaves CG. Do you trust the person who shared it? Please proceed with caution."
        />
        <div className="btnList justify-end gap-4">
          <Button
            text="Cancel"
            onClick={onClose}
            role="secondary"
          />
          <Button
            text="Continue"
            onClick={continueToExternalLink}
            role="primary"
          />
        </div>
      </div>
    </div>
  </Modal>);
}

export default React.memo(ExternalLinkModal);