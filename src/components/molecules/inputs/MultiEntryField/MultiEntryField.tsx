// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { DotsSixVertical, Minus, Plus } from '@phosphor-icons/react';
import React, { useCallback, useState } from 'react';
import './MultiEntryField.css';
import { DragDropContext, Draggable, DropResult, Droppable } from 'react-beautiful-dnd';
import Button from 'components/atoms/Button/Button';
import TextAreaField from '../TextAreaField/TextAreaField';

type Props = {
  entries: string[];
  setEntries: (entries: string[]) => void;
  newEntryBtnText: string;
  limit: number;
  disallowEmpty: boolean;
}

const MultiEntryField: React.FC<Props> = (props) => {
  const {
    entries,
    setEntries,
    newEntryBtnText,
    limit,
    disallowEmpty
  } = props;
  const [autoFocusIndex, setAutoFocusIndex] = useState<number | null>(null);
  const dragType = `entry-fields-${newEntryBtnText}`;

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { type, destination, source } = result;
    if (type === dragType) {
      const changedLocation = !!source && !!destination && destination.droppableId === source.droppableId && destination.index !== source.index;
      if (changedLocation) {
        const newEntries = [...entries];
        const [element] = newEntries.splice(source.index, 1);
        newEntries.splice(destination.index, 0, element);
        setEntries(newEntries);
      }
    }
  }, [dragType, entries, setEntries]);

  return (<div className='flex flex-col gap-1 cg-text-main'>
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId='entry-fields'
        type={dragType}
      >
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`multi-entry-field-container flex flex-col gap-1 ${snapshot.isDraggingOver ? ' dragging-over' : ''}`}
          >
            {entries.map((entry, index) => <Draggable
              draggableId={`${entry}_${index}`}
              index={index}
              key={index}
            >
              {(provided, snapshot) => (<div
                {...provided.draggableProps}
                ref={provided.innerRef}
                className='flex items-center gap-2'
              >
                <div {...provided.dragHandleProps} className='flex p-2'>
                  <DotsSixVertical className='w-4 h-4 cg-text-secondary' />
                </div>
                <div className='entry-field-content'>
                  <Minus weight='duotone' className='w-6 h-6 cg-text-secondary cursor-pointer' onClick={() => {
                    const newEntries = [...entries];
                    newEntries.splice(index, 1);
                    setEntries(newEntries);
                  }} />
                  <div className='flex-col gap-1 w-full'>
                    <TextAreaField 
                      inputClassName='multi-entry-text-input'
                      autoGrow
                      autoFocus={autoFocusIndex === index}
                      value={entry}
                      placeholder={`${newEntryBtnText} ${index + 1}`}
                      maxLetters={180}
                      onChange={value => {
                        const newEntries = [...entries];
                        newEntries[index] = value;
                        setEntries(newEntries);
                      }}
                    />
                    {disallowEmpty && entry.length === 0 && <span className='cg-text-warning'>This field cannot be empty</span>}
                  </div>
                </div>
              </div>
              )}
            </Draggable>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
    {entries.length < limit && <Button
      role='textual'
      className='w-fit'
      iconLeft={<Plus className='w-4 h-4'/>}
      text={newEntryBtnText}
      onClick={() => {
        setEntries([...entries, '']);
        setAutoFocusIndex(entries.length);
      }}
    />}
  </div>);
}

export default React.memo(MultiEntryField);