// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react';
import Button from 'components/atoms/Button/Button';
import { useSnackbarContext } from 'context/SnackbarContext';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import botsApi from 'data/api/bots';
import { BotInfo } from './BotsManagement';
import { Trash } from '@phosphor-icons/react';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';

type Props = {
  bot: BotInfo;
  setBot: React.Dispatch<React.SetStateAction<BotInfo | null>>;
  isCreating: boolean;
  onCancel: () => void;
  onBotCreated: (data: { name: string; token: string; webhookSecret: string | null }) => void;
  onBotRemoved: () => void;
};

const BotEditor: React.FC<Props> = (props) => {
  const { bot, setBot, isCreating, onCancel, onBotCreated, onBotRemoved } = props;
  const { showSnackbar } = useSnackbarContext();
  const { community } = useLoadedCommunityContext();
  const [saving, setSaving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const handleSave = async () => {
    if (!bot.name.trim()) {
      showSnackbar({ type: 'warning', text: 'Please enter a bot name' });
      return;
    }

    if (!bot.displayName.trim()) {
      showSnackbar({ type: 'warning', text: 'Please enter a display name' });
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        // Create new bot
        const response = await botsApi.createBot({
          name: bot.name.trim().toLowerCase().replace(/\s+/g, '-'),
          displayName: bot.displayName.trim(),
          description: bot.description || undefined,
          webhookUrl: bot.webhookUrl || undefined,
        });

        // Auto-add bot to current community
        await botsApi.addBotToCommunity({
          communityId: community.id,
          botId: response.bot.id,
        });

        onBotCreated({
          name: bot.displayName,
          token: response.token,
          webhookSecret: response.webhookSecret || null,
        });
      } else {
        // Update existing bot (only if owner)
        await botsApi.updateBot({
          botId: bot.id,
          displayName: bot.displayName.trim(),
          description: bot.description || undefined,
          webhookUrl: bot.webhookUrl || undefined,
        });
        showSnackbar({ type: 'success', text: 'Bot updated' });
      }
    } catch (e: any) {
      console.error('Failed to save bot:', e);
      showSnackbar({ type: 'warning', text: e.message || 'Failed to save bot' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      await botsApi.removeBotFromCommunity({
        communityId: community.id,
        botId: bot.id,
      });
      showSnackbar({ type: 'info', text: 'Bot removed from community' });
      onBotRemoved();
    } catch (e: any) {
      console.error('Failed to remove bot:', e);
      showSnackbar({ type: 'warning', text: e.message || 'Failed to remove bot' });
    }
  };

  return (
    <div className='flex flex-col gap-4 p-4 cg-bg-2nd cg-border-xl'>
      <h3 className='cg-text-lg-700'>{isCreating ? 'Create New Bot' : 'Bot Settings'}</h3>

      {isCreating && (
        <div className='flex flex-col gap-1'>
          <label className='cg-text-sm-500 cg-text-secondary'>Bot Name (unique identifier)</label>
          <input
            type='text'
            className='cg-input'
            placeholder='my-awesome-bot'
            value={bot.name}
            onChange={(e) => setBot({ ...bot, name: e.target.value })}
          />
          <span className='cg-text-xs-400 cg-text-secondary'>
            Lowercase letters, numbers, and hyphens only
          </span>
        </div>
      )}

      <div className='flex flex-col gap-1'>
        <label className='cg-text-sm-500 cg-text-secondary'>Display Name</label>
        <input
          type='text'
          className='cg-input'
          placeholder='My Awesome Bot'
          value={bot.displayName}
          onChange={(e) => setBot({ ...bot, displayName: e.target.value })}
        />
      </div>

      <div className='flex flex-col gap-1'>
        <label className='cg-text-sm-500 cg-text-secondary'>Description (optional)</label>
        <textarea
          className='cg-input'
          placeholder='What does this bot do?'
          rows={3}
          value={bot.description || ''}
          onChange={(e) => setBot({ ...bot, description: e.target.value })}
        />
      </div>

      <div className='flex flex-col gap-1'>
        <label className='cg-text-sm-500 cg-text-secondary'>Webhook URL (optional)</label>
        <input
          type='text'
          className='cg-input'
          placeholder='https://your-server.com/webhook'
          value={bot.webhookUrl || ''}
          onChange={(e) => setBot({ ...bot, webhookUrl: e.target.value })}
        />
        <span className='cg-text-xs-400 cg-text-secondary'>
          Receive message events at this URL
        </span>
      </div>

      <div className='flex gap-2 justify-end mt-4'>
        {!isCreating && (
          <Button
            role='borderless'
            iconLeft={<Trash weight='duotone' className='w-5 h-5' />}
            text='Remove from Community'
            onClick={() => setShowRemoveModal(true)}
          />
        )}
        <div className='flex-1' />
        <Button
          role='borderless'
          text='Cancel'
          onClick={onCancel}
        />
        <Button
          role='primary'
          text={isCreating ? 'Create Bot' : 'Save'}
          onClick={handleSave}
          disabled={saving}
        />
      </div>

      <ScreenAwareModal isOpen={showRemoveModal} onClose={() => setShowRemoveModal(false)} hideHeader>
        <div className='flex flex-col gap-4'>
          <h3>Remove Bot?</h3>
          <p>
            Are you sure you want to remove <strong>{bot.displayName}</strong> from this community?
            The bot will no longer be able to read or send messages here.
          </p>
          <div className='flex gap-2 justify-end'>
            <Button role='borderless' text='Cancel' onClick={() => setShowRemoveModal(false)} />
            <Button role='primary' text='Remove' onClick={handleRemove} />
          </div>
        </div>
      </ScreenAwareModal>
    </div>
  );
};

export default BotEditor;

