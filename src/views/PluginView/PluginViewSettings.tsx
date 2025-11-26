// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Warning, X } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import CheckboxBase from 'components/atoms/CheckboxBase/CheckboxBase';
import React, { useMemo } from 'react'
import { permissionToIcon } from './PluginView';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { useReportModalContext } from 'context/ReportModalProvider';
import { ReportType } from 'common/enums';


const permissionToText = (permission: Models.Plugin.PluginPermission) => {
  switch (permission) {
    case 'READ_TWITTER':
      return 'Reading your Twitter account';
    case 'READ_LUKSO':
      return 'Reading your Lukso account';
    case 'READ_FARCASTER':
      return 'Reading your Farcaster account';
    case 'READ_EMAIL':
      return 'Reading your email account';
    case 'READ_FRIENDS':
      return 'Reading your friend list';
    case 'ALLOW_MICROPHONE':
      return 'Allow microphone access';
    case 'ALLOW_CAMERA':
      return 'Allow camera access';
    default:
      return permission;
  }
};


type Props = {
  plugin: Models.Plugin.Plugin | undefined;
  checkedOptionals: Models.Plugin.PluginPermission[];
  handleToggleOptional: (permission: Models.Plugin.PluginPermission) => void;
  close: () => void;
};

const PluginViewSettings: React.FC<Props> = (props) => {
  const { plugin, checkedOptionals, handleToggleOptional, close } = props;
  const { isMobile } = useWindowSizeContext();
  const { showReportModal } = useReportModalContext();

  return (<Scrollable
    innerClassName='flex flex-col p-4 gap-6 cg-text-main'
    alwaysVisible={!isMobile}
  >
    <div className='flex flex-col gap-4 relative'>
      <h3>Plugin Settings</h3>
      <PluginPermissionUserSettings
        plugin={plugin}
        checkedOptionals={checkedOptionals}
        handleToggleOptional={handleToggleOptional}
      />
      <div className="cg-bg-2nd cg-circular cursor-pointer absolute -top-2 -right-2 p-1 cg-text-main z-10" onClick={(ev) => {
        ev.stopPropagation();
        close();
      }}>
        <X className='w-5 h-5' />
      </div>
    </div>
    <Button
      className='w-full'
      role='destructive'
      text={'Report this plugin'}
      iconLeft={<Warning weight='duotone' className='w-5 h-5' />}
      onClick={() => {
        if (plugin) {
          close();
          showReportModal({ type: ReportType.PLUGIN, targetId: plugin.pluginId });
        }
      }}
    />
  </Scrollable>);
}

type PluginPermissionUserSettingsProps = {
  plugin: Models.Plugin.Plugin | undefined;
  checkedOptionals: Models.Plugin.PluginPermission[];
  handleToggleOptional: (permission: Models.Plugin.PluginPermission) => void;
};

export const PluginPermissionUserSettings: React.FC<PluginPermissionUserSettingsProps> = (props) => {
  const { plugin, checkedOptionals, handleToggleOptional } = props;
  const hasMandatoryPermissions = useMemo(() => (plugin?.permissions?.mandatory?.length || 0) > 0, [plugin?.permissions?.mandatory]);
  const hasOptionalPermissions = useMemo(() => (plugin?.permissions?.optional?.length || 0) > 0, [plugin?.permissions?.optional]);

  if (!hasMandatoryPermissions && !hasOptionalPermissions) {
    return null;
  }

  return <div className='flex flex-col cg-bg-subtle p-4 gap-8 cg-border-xxl'>
    {hasMandatoryPermissions && <div className='flex flex-col gap-4'>
      <h3 className='cg-text-secondary'>This plugin requires these permissions to work:</h3>
      <div className='flex flex-col gap-2'>
        {plugin?.permissions?.mandatory?.map(permission => (
          <div key={permission} className='flex gap-2 items-center'>
            {permissionToIcon(permission)}
            <span>{permissionToText(permission)}</span>
          </div>
        ))}
      </div>
    </div>}

    {hasOptionalPermissions && <div className='flex flex-col gap-4'>
      <h3 className='cg-text-secondary'>Optionally, this plugin wants access to these permissions:</h3>
      <div className='flex flex-col gap-2'>
        {plugin?.permissions?.optional?.map(permission => (
          <div key={permission} className='flex gap-2 items-center cursor-pointer' onClick={() => handleToggleOptional(permission)}>
            <CheckboxBase
              size='normal'
              type='checkbox'
              checked={checkedOptionals.includes(permission)}
            />
            {permissionToIcon(permission)}
            <span>{permissionToText(permission)}</span>
          </div>
        ))}
      </div>
    </div>}
  </div>;
};

export default PluginViewSettings