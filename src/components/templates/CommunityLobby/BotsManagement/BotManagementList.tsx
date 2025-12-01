// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Robot, Plus } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import SettingsButton from 'components/molecules/SettingsButton/SettingsButton';
import React from 'react';
import { CommunityBotInfo } from './BotsManagement';

type Props = {
  communityBots: CommunityBotInfo[];
  selectedId: string;
  isCreating: boolean;
  onCreateBot: () => void;
  onAddBot: () => void;
  onSelectBot: (id: string) => void;
};

const BotManagementList: React.FC<Props> = (props) => {
  const { communityBots, selectedId, isCreating, onCreateBot, onAddBot, onSelectBot } = props;

  return (
    <div className='flex flex-col gap-4'>
      <div className='cg-caption-md-600 cg-text-secondary'>Installed Bots</div>
      <div className='flex flex-col gap-1'>
        {communityBots.length === 0 && (
          <div className='cg-text-secondary cg-text-md-400 py-2'>
            No bots installed yet
          </div>
        )}
        {communityBots.map(cb => (
          <SettingsButton
            leftElement={<Robot weight='duotone' className='w-5 h-5' />}
            key={cb.id}
            text={cb.displayName || cb.name}
            onClick={() => onSelectBot(cb.id)}
            active={selectedId === cb.id}
          />
        ))}
      </div>
      <div className='flex flex-col gap-2'>
        <Button
          className='w-full cg-text-lg-500'
          iconLeft={<Plus weight='bold' className='w-5 h-5' />}
          role='secondary'
          text='Add Bot by ID'
          onClick={onAddBot}
        />
        <Button
          className={`w-full cg-text-lg-500 ${isCreating ? ' active' : ''}`}
          iconLeft={<Robot weight='duotone' className='w-5 h-5' />}
          role='primary'
          text='Create New Bot'
          onClick={onCreateBot}
        />
      </div>
    </div>
  );
};

export default BotManagementList;

