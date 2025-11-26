// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { CaretDown, ExclamationMark, QuestionMark, X } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import ListItem from 'components/atoms/ListItem/ListItem';
import ScreenAwareDropdown from 'components/atoms/ScreenAwareDropdown/ScreenAwareDropdown';
import React, { useMemo } from 'react'

type Props = {
  plugin: Models.Plugin.Plugin;
  setPlugin: React.Dispatch<React.SetStateAction<Models.Plugin.Plugin | undefined>>;
}

type permissionToggle = {
  permission: Models.Plugin.PluginPermission;
  label: string;
}

const getUserPermissionToggles: permissionToggle[] = [{
  permission: 'READ_TWITTER',
  label: 'Get user twitter',
}, {
  permission: 'READ_LUKSO',
  label: 'Get user lukso',
}, {
  permission: 'READ_FARCASTER',
  label: 'Get user farcaster',
}, {
  permission: 'READ_EMAIL',
  label: 'Get user email',
}];

const getFriendsPermissionToggles: permissionToggle[] = [{
  permission: 'READ_FRIENDS',
  label: 'Get user friends',
}];

const devicesPermissionToggles: permissionToggle[] = [{
  permission: 'ALLOW_MICROPHONE',
  label: 'Allow microphone',
}, {
  permission: 'ALLOW_CAMERA',
  label: 'Allow camera',
}];

const PluginEditorPermissionsSetter = (props: Props) => {
  const { plugin, setPlugin } = props;

  const setPermission = (permission: Models.Plugin.PluginPermission, value: 'mandatory' | 'optional' | 'no') => {
    setPlugin(oldPlugin => {
      if (!oldPlugin) return undefined;
      const newPermissions: Models.Plugin.PluginPermissions = {
        mandatory: value === 'mandatory' ? [...(oldPlugin.permissions?.mandatory ?? []), permission] : (oldPlugin.permissions?.mandatory ?? []).filter(p => p !== permission),
        optional: value === 'optional' ? [...(oldPlugin.permissions?.optional ?? []), permission] : (oldPlugin.permissions?.optional ?? []).filter(p => p !== permission),
      }

      return ({
        ...oldPlugin,
        permissions: newPermissions
      });
    });
  }

  return <div className='flex flex-col gap-4'>
    <span className='cg-caption-md-600 cg-text-secondary'>Permission Settings</span>
    <div className='flex flex-col gap-4 cg-content-stack p-4 cg-border-xxl cg-text-main'>
      <div className='flex flex-col gap-2 cg-bg-brand-subtle cg-border-brand p-4 cg-border-xl'>
        <span className='cg-text-brand cg-text-lg-500'>Here you can set which permissions are required to run your plugin.</span>
        <span className='cg-text-main cg-text-md-400'>Users will need to accept these permissions to use your plugin. Any request that requires a permission not listed here will be rejected.</span>
      </div>

      <div className='flex flex-col gap-2'>
        <span className='cg-caption-md-600 cg-text-secondary'>Devices</span>
        {devicesPermissionToggles.map(toggle => (
          <div className='flex items-center justify-between gap-2' key={toggle.label}>
            <span>{toggle.label}</span>
            <PluginPermissionDropdown
              plugin={plugin}
              permission={toggle.permission}
              setPermission={setPermission}
            />
          </div>
        ))}

        <span className='cg-caption-md-600 cg-text-secondary pt-2'>Get user request</span>
        {getUserPermissionToggles.map(toggle => (
          <div className='flex items-center justify-between gap-2' key={toggle.label}>
            <span>{toggle.label}</span>
            <PluginPermissionDropdown
              plugin={plugin}
              permission={toggle.permission}
              setPermission={setPermission}
            />
          </div>
        ))}

        <span className='cg-caption-md-600 cg-text-secondary pt-2'>Get user friends request</span>
        {getFriendsPermissionToggles.map(toggle => (
          <div className='flex items-center justify-between gap-2' key={toggle.label}>
            <span>{toggle.label}</span>
            <PluginPermissionDropdown
              plugin={plugin}
              permission={toggle.permission}
              setPermission={setPermission}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
}

type PluginPermissionDropdownProps = {
  plugin: Models.Plugin.Plugin;
  permission: Models.Plugin.PluginPermission;
  setPermission: (permission: Models.Plugin.PluginPermission, value: 'mandatory' | 'optional' | 'no') => void;
};

const PluginPermissionDropdown: React.FC<PluginPermissionDropdownProps> = (props) => {
  const currentState = useMemo(() => {
    if (props.plugin.permissions?.mandatory.includes(props.permission)) return 'Mandatory';
    if (props.plugin.permissions?.optional.includes(props.permission)) return 'Optional';
    return 'No need';
  }, [props.plugin.permissions, props.permission]);

  const getIconForState = (state: 'mandatory' | 'optional' | 'no') => {
    switch (state) {
      case 'mandatory': return <ExclamationMark weight='duotone' className='h-5 w-5 cg-text-success' />;
      case 'optional': return <QuestionMark weight='duotone' className='h-5 w-5 cg-text-warning' />;
      case 'no': return <X weight='duotone' className='h-5 w-5 cg-text-error' />;
    }
  }

  return <ScreenAwareDropdown
    items={[
      <ListItem
        key='no'
        title='No need'
        onClick={() => props.setPermission(props.permission, 'no')}
        icon={getIconForState('no')}
      />,
      <ListItem
        key='optional'
        title='Optional'
        onClick={() => props.setPermission(props.permission, 'optional')}
        icon={getIconForState('optional')}
      />,
      <ListItem
        key='mandatory'
        title='Mandatory'
        onClick={() => props.setPermission(props.permission, 'mandatory')}
        icon={getIconForState('mandatory')}
      />,
    ]}
    triggerContent={<Button
      role='chip'
      text={currentState}
      iconLeft={getIconForState(currentState === 'Mandatory' ? 'mandatory' : currentState === 'Optional' ? 'optional' : 'no')}
      iconRight={<CaretDown className='w-5 h-5' />}
    />}
  />
}

export default React.memo(PluginEditorPermissionsSetter);