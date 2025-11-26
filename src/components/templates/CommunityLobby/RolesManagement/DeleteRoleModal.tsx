// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from 'components/atoms/Button/Button';
import Modal from 'components/atoms/Modal/Modal';
import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';

type Props = {
  visible: boolean;
  onDeleteModal: () => void;
  onCancel: () => void;
  numUsers: number;
}

const DeleteRoleModal: React.FC<Props> = (props) => {
  const { visible, onDeleteModal, onCancel, numUsers } = props;

  if (!visible) return null;

  return (
    <Modal close={onCancel} headerText='Delete role' >
      <div className='flex flex-col gap-4'>
        <span>
          Are you sure you want to delete this role? This will affect {numUsers} people and cannot be undone.
        </span>
        <Button 
          role='destructive'
          text='Delete role'
          className='w-full self-center'
          iconLeft={<ExclamationTriangleIcon className='w-5 h-5' />}
          onClick={onDeleteModal}
        />
        <Button 
          role='secondary'
          text='Cancel'
          className='w-full self-center'
          onClick={onCancel}
        />
      </div>
    </Modal>
  )
}

export default React.memo(DeleteRoleModal);