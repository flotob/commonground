// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { PencilIcon } from "@heroicons/react/20/solid";
import Timestamp from "components/atoms/Timestamp/Timestamp";
import dayjs from "dayjs";
import React from "react";

type Props = {
  isEdited?: boolean;
  messageTimestamp?: string;
  lastUpdateTimestamp?: string;
};

const MessageTimestamp = (props: Props) => {
  const { isEdited } = props;
  const messageItemDateClassname = [`message-item-date-container`,
    !!isEdited ? 'edited' : ''
  ].join(' ').trim();

  if (!props.messageTimestamp) return null;

  const date = dayjs(props.messageTimestamp);
  const lastUpdate = dayjs(props.lastUpdateTimestamp);
  const updatedSameDay = date.isSame(lastUpdate, 'day');

  return <div key='message-timestamp' className={messageItemDateClassname}>
    <Timestamp className='message-item-date' timestamp={props.messageTimestamp} mode='hour' />
    {props.lastUpdateTimestamp && !!props.isEdited && <>
      <span className='message-item-date-divider' >⋅</span>
      <div className='message-item-edited-timestamp-container'>
        <Timestamp className='message-item-date message-item-edited-date' timestamp={props.lastUpdateTimestamp} mode={updatedSameDay ? 'hour' : 'dateHour'} />
        <PencilIcon className='h-4 w-4' />
      </div>
    </>}
  </div>;
}

export default React.memo(MessageTimestamp);