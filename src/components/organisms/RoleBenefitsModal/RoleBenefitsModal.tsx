// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from 'react'
import './RoleBenefitsModal.css';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import Button from 'components/atoms/Button/Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import RolePhoto from 'components/molecules/RolePhoto/RolePhoto';
import RolePermissionList from 'components/molecules/RolePermissionList/RolePermissionList';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { PermissionType } from 'components/molecules/RolePermissionToggle/RolePermissionToggle';
import { toPermissionType } from 'components/templates/CommunityLobby/ChannelManagement/EditChannelForm';

type Props = {
  role: Models.Community.Role;
  visible: boolean;
  onClose: () => void;
};

function calculateRoleChannels(channels: readonly Models.Community.Channel[], role: Models.Community.Role) {
  const result: {
    channel: Models.Community.Channel;
    permission: PermissionType;
  }[] = [];

  for (const channel of channels) {
    const rolePermission = channel.rolePermissions.find(rolePermission => rolePermission.roleId === role.id);
    if (rolePermission) {
      let rolePermissionValues = rolePermission?.permissions;
      const permission = toPermissionType(rolePermissionValues);
      if (permission !== 'none') {
        result.push({ channel, permission });
      }
    }
  }

  return result;
}

const RoleBenefitsModal: React.FC<Props> = (props) => {
  const { role, visible, onClose } = props;
  const { channels } = useLoadedCommunityContext();

  const roleChannels = useMemo(() => calculateRoleChannels(channels, role), [channels, role]);

  return (<ScreenAwareModal
    customClassname='relative'
    isOpen={visible}
    onClose={onClose}
    hideHeader
  >
    <Button
      className='absolute top-4 right-4 cg-circular'
      role='secondary'
      iconLeft={<XMarkIcon className='w-6 h-6'/>}
      onClick={onClose}
    />
    <div className='flex flex-col items-center gap-4'>
      <RolePhoto
        roleId={role.id}
        communityId={role.communityId}
        imageId={role.imageId}
        small
      />
      <span className='cg-heading-2 cg-text-main'>{role.title}</span>
      {role.description && <span className='cg-text-lg-400 cg-text-secondary'>{role.description}</span>}
      <RolePermissionList
        title='What this role offers'
        permissions={role.permissions}
        channels={roleChannels}
      />
    </div>
  </ScreenAwareModal>);
}

export default RoleBenefitsModal