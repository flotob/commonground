// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import Button from '../../../atoms/Button/Button';

const controlButtons: { text: string, value: Common.Content.MediaSize }[] = [{
  text: 'S',
  value: 'small'
}, {
  text: 'M',
  value: 'medium'
}, {
  text: 'L',
  value: 'large'
}];

type Props = {
  currSize: Common.Content.MediaSize;
  onUpdateSize: (size: Common.Content.MediaSize) => void;
  onRemoveNode: () => void;
}

const MediaControl: React.FC<Props> = ({ currSize, onUpdateSize, onRemoveNode }) => {
  return (
    <>
      {controlButtons.map(buttonInfo => <Button
        key={buttonInfo.value}
        role={currSize === buttonInfo.value ? 'primary' : 'secondary'}
        text={buttonInfo.text}
        onClick={() => onUpdateSize(buttonInfo.value)}
      />)}
      <Button
        role='borderless'
        text='Remove'
        onClick={onRemoveNode}
      />
    </>
  )
}

export default React.memo(MediaControl);