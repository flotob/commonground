// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import React, { useCallback, useMemo } from 'react';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import ChannelList, { calculateChannelPermissions } from '../../../components/organisms/ChannelList/ChannelList';
import NotificationDot from 'components/atoms/NotificationDot/NotificationDot';

type Props = {
  area: Models.Community.Area;
  channels: Models.Community.Channel[];
  expanded: boolean;
  setExpandedState: (areaId: string) => void;
  onChannelClick?: () => void;
}

function AreaItem(props: Props) {
  const { area, channels, expanded, setExpandedState, onChannelClick } = props;
  const { community } = useLoadedCommunityContext();
  const hasUnread = useMemo(() => {
    return channels?.some(channel => !calculateChannelPermissions(community, channel) && (channel.unread || 0) > 0);
  }, [channels, community]);

  /*
  const rightsideInfo = React.useMemo(() => {
    if (!isAreaLocked) {
      return <div className='flex items-center gap-2'>
        <ImUnlocked className="text-sm cursor-pointer" onClick={showModal} />
      </div>;
    } else if (isAreaLocked) {
      return (
        <Tooltip
          placement="top"
          triggerClassname='flex'
          triggerContent={<LockedIcon className="cursor-pointer" />}
          tooltipContent="You don't have the assets to access this area"
          offset={4}
        />
      );
      // } else if (area.locked === "pending") {
      //   return <ImSpinner10 className="spinner" style={{ fontSize: '1.4rem' }} />
    }
  }, [isAreaLocked, showModal]);
  */

  const areaClick = useCallback((ev: React.MouseEvent) => {
    setExpandedState(area.id);
  }, [area.id, setExpandedState]);

  const areaContainerClassname = `area-container${expanded ? '' : ' area-container-collapsed'}${!expanded && hasUnread ? ' unread' : ''}`;
  const chevronClassname = `w-5 h-5 area-chevron-icon ${expanded ? '' : 'area-chevron-icon-rotated'}`;

  return (
    <div className={areaContainerClassname}>
      <div className="area-name" onClick={areaClick}>
        <ChevronDownIcon className={chevronClassname} />
        <span className="area-name-title">{area.title}</span>
        <div className='area-name-rightside-info'>
          {/* {rightsideInfo} */}
          {hasUnread && !expanded && <NotificationDot />}
        </div>
      </div>
      {expanded && channels.length > 0 && <ChannelList channels={channels} onChannelClick={onChannelClick} />}
    </div>
  );
}

export const MemoAreaItem = React.memo(AreaItem);