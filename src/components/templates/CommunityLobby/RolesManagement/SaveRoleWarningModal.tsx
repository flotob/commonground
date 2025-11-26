// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import Modal from 'components/atoms/Modal/Modal';
import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';

type Props = {
  visible: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const SaveRoleWarningModal: React.FC<Props> = (props) => {
  const { visible, onSave, onCancel } = props;

  if (!visible) return null;

  return (
    <Modal close={onCancel} headerText='Change claim settings' >
      <div className='flex flex-col gap-4'>
        <span>
            When you save, all users will lose this role. It will take some time to calculate. You can only make 10 changes to claimable roles per day, and this cannot be undone. Are you sure you want to continue?
        </span>
        <Button 
          role='destructive'
          text='Confirm change'
          iconLeft={<ExclamationTriangleIcon className='w-5 h-5' />}
          onClick={onSave}
        />
        <Button 
          role='secondary'
          text='Cancel'
          onClick={onCancel}
        />
      </div>
    </Modal>
  )
}

export default React.memo(SaveRoleWarningModal);