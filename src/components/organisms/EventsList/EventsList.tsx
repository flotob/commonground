// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import EmptyState from 'components/molecules/EmptyState/EmptyState';
import EventCard from 'components/molecules/EventCard/EventCard';
import dayjs from 'dayjs';
import React from 'react'

type Props = {
  onUpdateEvent: (eventId: string, eventChanges: Partial<Models.Community.Event>) => void;
  events: API.Community.getEventList.Response;
  order: 'upcoming' | 'past';
  showCommunityOnCards?: boolean;
};

export function getDateTitle(dateStr: string, order: Props['order']): string {
  const date = dayjs(dateStr);

  if (date.isToday()) {
    return order === 'past' ? 'Earlier Today' : 'Today';
  } else if (date.isTomorrow()) {
    return 'Tomorrow';
  } else if (date.isYesterday()) {
    return 'Yesterday';
  }

  return date.format('MMM D');
}

const EventsList: React.FC<Props> = (props) => {
  const { onUpdateEvent, events, order, showCommunityOnCards } = props;
  const { days, eventsPerDay } = React.useMemo(() => {
    const eventsPerDay: Map<string, Models.Community.Event[]> = new Map();
    for (const event of events) {
      const date = dayjs(event.scheduleDate).format("MMMM DD, YYYY");

      const array = eventsPerDay.get(date);
      if (array) {
        array.push(event);
      } else {
        eventsPerDay.set(date, [event]);
      }
    }

    const days = Array.from(eventsPerDay.keys()).sort((a, b) => {
      const dayAEntry = eventsPerDay.get(a)?.[0];
      const dayBEntry = eventsPerDay.get(b)?.[0];
      const dayA = dayjs(dayAEntry?.scheduleDate);
      const dayB = dayjs(dayBEntry?.scheduleDate);

      const res = order === 'past' ? dayA.isBefore(dayB) : dayB.isBefore(dayA);
      return res ? 1 : -1;
    });

    for (const day of days) {
      eventsPerDay.get(day)?.sort((a,b) => order === 'past' ? b.scheduleDate.localeCompare(a.scheduleDate) : a.scheduleDate.localeCompare(b.scheduleDate));
    }

    return { eventsPerDay, days };
  }, [events, order]);

  return (<div className='flex flex-col gap-16'>
    {days.map(day => <div key={day} className='flex flex-col gap-4'>
      <span className='cg-heading-3 cg-text-main'>{getDateTitle(day, order)}</span>
      {eventsPerDay.get(day)?.map(event => <div key={event.id} className='flex flex-col gap-4'>
        <EventCard
          event={event}
          onUpdateEvent={onUpdateEvent}
          showCommunity={showCommunityOnCards}
        />
        <div className='cg-separator' />
      </div>)}
    </div>)}

    {days.length === 0 && <div className='cg-bg-subtle cg-border-xxl cg-text-main flex flex-col justify-center items-center gap-2 self-stretch py-16 px-4'>
      <EmptyState
        title={`No ${order} events`}
        description={order === 'upcoming'
          ? 'Check back later when communities schedule more events!'
          : 'Events that have ended will be archived here'}
      />
    </div>}
  </div>)
}

export default React.memo(EventsList);