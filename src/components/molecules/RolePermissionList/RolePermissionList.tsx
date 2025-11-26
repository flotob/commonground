// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo, useState } from 'react'
import './RolePermissionList.css';
import { PermissionType } from '../RolePermissionToggle/RolePermissionToggle';
import RolePermissionUnit from 'components/atoms/RolePermissionUnit/RolePermissionUnit';
import Button from 'components/atoms/Button/Button';
import { allPermissions, permissionsPerStarNumber } from 'components/templates/CommunityLobby/RolesManagement/RoleEditor';
import { ChevronDownIcon, StarIcon } from '@heroicons/react/20/solid';

const permissionOrder: readonly PermissionType[] = ['moderate', 'full', 'read', 'preview'];

function permissionToTitle(permission: PermissionType) {
  switch (permission) {
    case 'moderate': return 'Moderate these chats';
    case 'full': return 'Access these chats';
    case 'read': return 'Read these chats';
    case 'preview': return 'Preview these chats';
  }
}

type Props = {
  title: string;
  permissions: Common.CommunityPermission[];
  channels: {
    channel: Models.Community.Channel;
    permission: PermissionType;
  }[];
}

const SHOW_MORE_LIMIT = 4;

const RolePermissionList: React.FC<Props> = (props) => {
  const { title, permissions, channels } = props;
  const [_currentTab, setCurrentTab] = useState<'channels' | 'permissions'>(channels.length > 0 ? 'channels' : 'permissions');
  const [showMore, setShowMore] = useState(false);
  let currentChannelCount = 0;

  let currentTab = _currentTab;
  if (permissions.length === 0 && currentTab === 'permissions') currentTab = 'channels';

  const shouldShowMoreBtn = 
    (currentTab === 'channels' && channels.length > SHOW_MORE_LIMIT) ||
    (currentTab === 'permissions' && permissions.length > SHOW_MORE_LIMIT);
  const missingCount = currentTab === 'channels' ? channels.length - SHOW_MORE_LIMIT : permissions.length - SHOW_MORE_LIMIT;

  const newChannelMap = useMemo(() => {
    const result: { [permission: string]: Models.Community.Channel[] } = {};
    for (const channel of channels) {
      if (result[channel.permission]) {
        result[channel.permission].push(channel.channel);
      } else {
        result[channel.permission] = [channel.channel];
      }
    }
    return result;
  }, [channels]);

  const sortedPermissions = useMemo(() => {
    const sorted = [...permissions].sort((a, b) => {
      const aValue = Object.keys(permissionsPerStarNumber).find(starNum => permissionsPerStarNumber[Number(starNum)].includes(a));
      const bValue = Object.keys(permissionsPerStarNumber).find(starNum => permissionsPerStarNumber[Number(starNum)].includes(b));
      return Number(bValue) - Number(aValue);
    });

    if (showMore) return sorted;
    else return sorted.slice(0, SHOW_MORE_LIMIT);
  }, [permissions, showMore]);

  if (channels.length === 0 && permissions.length === 0) return null;

  return <div className='flex flex-col self-stretch p-2 gap-2'>
    <span className='cg-text-lg-500 cg-text-main'>{title}</span>
    <div className='flex gap-2'>
      {channels.length > 0 && <Button
        role='chip'
        text={<span className='cg-text-md-500'>Chats <span className={currentTab !== 'channels' ? 'cg-text-secondary' : undefined}>{channels.length}</span></span>}
        className={currentTab === 'channels' ? 'active' : undefined}
        onClick={() => {
          setShowMore(false);
          setCurrentTab('channels');
        }}
      />}
      {permissions.length > 0 && <Button
        role='chip'
        text={<span className='cg-text-md-500'>Permissions <span className={currentTab !== 'permissions' ? 'cg-text-secondary' : undefined}>{permissions.length}</span></span>}
        className={currentTab === 'permissions' ? 'active' : undefined}
        onClick={() => {
          setShowMore(false);
          setCurrentTab('permissions');
        }}
      />}
    </div>
    {currentTab === 'channels' && permissionOrder.map(permission => {
      let channels = (newChannelMap[permission] || []);
      if (!showMore) {
        if (currentChannelCount >= SHOW_MORE_LIMIT) return null;
        channels = channels.slice(0, SHOW_MORE_LIMIT - currentChannelCount);
        currentChannelCount += channels.length;
      }

      if (channels && channels.length > 0) {
        return <div className='flex flex-col gap-2' key={permission}>
          <RolePermissionUnit
            permissionType={permission}
            title={permissionToTitle(permission)}
          />
          {channels.map(channel => <div className='channel-role-preview flex p-2 gap-4 self-stretch cg-border-xxl' key={channel.channelId}>
            <div className='channel-role-icon-preview flex items-center justify-center cg-heading-3'>
              {channel.emoji}
            </div>
            <div className='flex flex-col justify-center flex-1'>
              <span className='cg-text-lg-500 cg-text-main'>{channel.title}</span>
              {channel.description && <span className='cg-text-lg-400 cg-text-secondary'>{channel.description}</span>}
            </div>
          </div>)}
        </div>
      }
      return null;
    })}
    {currentTab === 'permissions' && sortedPermissions.map(permission => {
      const starNumber = Number(Object.keys(permissionsPerStarNumber).find(starNumber => {
        return permissionsPerStarNumber[Number(starNumber)].includes(permission);
      }) || 0);
      const permissionData = allPermissions.find(permissionInfo => permissionInfo.permission === permission);

      if (permissionData && starNumber) {
        return <div className='channel-role-preview flex p-4 gap-4 self-stretch cg-border-xxl' key={permission}>
          <div className='flex flex-col justify-center flex-1'>
            <span className='cg-text-lg-500 cg-text-main'>{permissionData.title}</span>
            {permissionData.description && <span className='cg-text-lg-400 cg-text-secondary'>{permissionData.description}</span>}
          </div>
          <div className='flex items-center'>
            {starNumber >= 1 && <StarIcon className='w-5 h-5' />}
            {starNumber >= 2 && <StarIcon className='w-5 h-5' />}
            {starNumber >= 3 && <StarIcon className='w-5 h-5' />}
          </div>
        </div>;
      }

      return null;
    })}
    {!showMore && shouldShowMoreBtn && <Button
      role='secondary'
      className='self-start'
      text={`Show ${missingCount} more`}
      iconRight={<ChevronDownIcon className='w-5 h-5'/>}
      onClick={() => setShowMore(true)}
    />}
  </div>;
}

export default React.memo(RolePermissionList);