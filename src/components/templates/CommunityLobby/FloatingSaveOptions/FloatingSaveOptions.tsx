// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './FloatingSaveOptions.css';
import Button from 'components/atoms/Button/Button';
import React from 'react'

type Props = {
  onSave: () => void;
  onDiscard?: () => void;
  onDelete?: () => void;
  deleteText?: string;
};

const FloatingSaveOptions: React.FC<Props> = (props) => {
  const {
    onSave,
    onDiscard,
    onDelete,
    deleteText
  } = props;
  return (<div className='absolute bottom-4 left-0 right-0 flex items-center justify-center pointer-events-none z-10'>
    <div className='floating-save-options flex gap-2 p-4 cg-bg-subtle cg-border-xxl pointer-events-auto'>
      {!!onDiscard && <Button
        text='Discard'
        role='secondary'
        onClick={onDiscard}
      />}
      {!!onDelete && <Button
        text={deleteText || 'Delete'}
        role='destructive'
        onClick={onDelete}
      />}
      <Button
        text='Save changes'
        role='primary'
        onClick={onSave}
      />
    </div>
  </div>);
}

export default React.memo(FloatingSaveOptions);