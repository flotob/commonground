// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from 'react'
import './RolePermissionToggleUnit.css';
import { PermissionType } from '../../molecules/RolePermissionToggle/RolePermissionToggle';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import ListItem from '../ListItem/ListItem';
import ScreenAwareDropdown from '../ScreenAwareDropdown/ScreenAwareDropdown';
import RolePermissionUnit, { RolePermissionIcon, permissionToTitle } from '../RolePermissionUnit/RolePermissionUnit';

type Props = {
  availablePermissions: PermissionType[];
  role: Models.Community.Role;
  selectedPermission: PermissionType;
  setRolesPermissions: React.Dispatch<React.SetStateAction<{ [id: string]: PermissionType }>>;

  forcedTriggerTitle?: string;
  forcedSetRolesPermissions?: (permission: PermissionType) => void;
};

const RolePermissionToggleUnit: React.FC<Props> = (props) => {
  const {availablePermissions, role, setRolesPermissions, forcedTriggerTitle, forcedSetRolesPermissions } = props;
  const selectedPermission = props.selectedPermission || 'none';

  const trigger = useMemo(() => {
    if (forcedTriggerTitle) {
      return <div className='flex gap-1 p-2 cg-text-md-500 cg-text-secondary items-center w-fit cg-hoverable-w-bg cg-border-l cursor-pointer'>
      <span>{forcedTriggerTitle}</span>
      <ChevronDownIcon className='h-5 w-5'/>
    </div>
    }
    return <RolePermissionUnit
      permissionType={selectedPermission}
      showChevron
    />
  }, [forcedTriggerTitle, selectedPermission]);

  const items = useMemo(() => {
    return availablePermissions.map(permission => {
    let onClick = (() => setRolesPermissions(old => ({...old, [role.id]: permission})));
    if (forcedSetRolesPermissions) onClick = () => forcedSetRolesPermissions(permission);
    return <ListItem
        key={permission}
        title={permissionToTitle(permission)}
        icon={<RolePermissionIcon permission={permission} />}
        onClick={onClick}
        selected={selectedPermission === permission}
        propagateEventsOnClick
      />
    })
  }, [availablePermissions, forcedSetRolesPermissions, role.id, selectedPermission, setRolesPermissions]); 

  return (
    <div className='role-permission-toggle-unit'>
      <div className='flex items-center gap-2 flex-1 whitespace-nowrap overflow-hidden'>
        <span className='title-text overflow-hidden text-ellipsis'>
          {role.title}
        </span>
      </div>
      <ScreenAwareDropdown
        triggerContent={trigger}
        items={items}
      />
    </div>
  );
}

export default RolePermissionToggleUnit