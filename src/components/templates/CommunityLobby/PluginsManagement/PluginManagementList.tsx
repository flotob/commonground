// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Plug } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import SettingsButton from 'components/molecules/SettingsButton/SettingsButton';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import React from 'react';

type Props = {
  selectedId: string;
  isCreating: boolean;
  onCreatePlugin: () => void;
  onSelectPlugin: (id: string) => void;
}

const PluginManagementList: React.FC<Props> = (props) => {
  const { community } = useLoadedCommunityContext();
  const { selectedId, isCreating, onCreatePlugin, onSelectPlugin } = props;

  return <div className='flex flex-col gap-4'>
    <div className='cg-caption-md-600 cg-text-secondary'>Plugins</div>
    <div className='flex flex-col gap-1'>
      {community.plugins.map(plugin => (<SettingsButton
        leftElement={<Plug weight='duotone' className='w-5 h-5' />}
        key={plugin.id}
        text={plugin.name}
        onClick={() => onSelectPlugin(plugin.id)}
        active={selectedId === plugin.id}
      />))}
    </div>
    <Button
      className={`w-full cg-text-lg-500 ${isCreating ? ' active' : ''}`}
      iconLeft={<Plug weight='duotone' className='w-5 h-5' />}
      role='primary'
      text="Create plugin"
      onClick={onCreatePlugin}
    />
  </div>;
};

export default PluginManagementList;