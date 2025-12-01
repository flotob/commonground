// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react';
import Button from 'components/atoms/Button/Button';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import { useSnackbarContext } from 'context/SnackbarContext';
import botsApi from 'data/api/bots';
import { BotInfo } from './BotsManagement';
import { Robot, MagnifyingGlass } from '@phosphor-icons/react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBotAdded: () => void;
  communityId: string;
};

const AddBotModal: React.FC<Props> = ({ isOpen, onClose, onBotAdded, communityId }) => {
  const { showSnackbar } = useSnackbarContext();
  const [botId, setBotId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundBot, setFoundBot] = useState<BotInfo | null>(null);

  const handleLookup = async () => {
    if (!botId.trim()) {
      showSnackbar({ type: 'warning', text: 'Please enter a bot ID' });
      return;
    }

    setLookingUp(true);
    try {
      const response = await botsApi.getBotById({ botId: botId.trim() });
      if (response.bot) {
        setFoundBot(response.bot);
      } else {
        showSnackbar({ type: 'warning', text: 'Bot not found' });
      }
    } catch (e: any) {
      console.error('Failed to look up bot:', e);
      showSnackbar({ type: 'warning', text: e.message || 'Bot not found' });
    } finally {
      setLookingUp(false);
    }
  };

  const handleAdd = async () => {
    if (!foundBot) return;

    setAdding(true);
    try {
      await botsApi.addBotToCommunity({
        communityId,
        botId: foundBot.id,
      });
      onBotAdded();
      handleClose();
    } catch (e: any) {
      console.error('Failed to add bot:', e);
      showSnackbar({ type: 'warning', text: e.message || 'Failed to add bot' });
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setBotId('');
    setFoundBot(null);
    onClose();
  };

  return (
    <ScreenAwareModal isOpen={isOpen} onClose={handleClose}>
      <div className='flex flex-col gap-4'>
        <h3>Add Bot to Community</h3>
        <p className='cg-text-secondary'>
          Enter the Bot ID provided by the bot developer to add it to your community.
        </p>

        <div className='flex flex-col gap-1'>
          <label className='cg-text-sm-500 cg-text-secondary'>Bot ID</label>
          <div className='flex gap-2'>
            <input
              type='text'
              className='cg-input flex-1'
              placeholder='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
              value={botId}
              onChange={(e) => {
                setBotId(e.target.value);
                setFoundBot(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
            <Button
              role='secondary'
              iconLeft={<MagnifyingGlass weight='bold' className='w-5 h-5' />}
              text='Look Up'
              onClick={handleLookup}
              disabled={lookingUp}
            />
          </div>
        </div>

        {foundBot && (
          <div className='flex flex-col gap-2 p-4 cg-bg-subtle cg-border-xl'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full cg-bg-2nd flex items-center justify-center'>
                <Robot weight='duotone' className='w-6 h-6' />
              </div>
              <div className='flex flex-col'>
                <span className='cg-text-lg-600'>{foundBot.displayName}</span>
                <span className='cg-text-sm-400 cg-text-secondary'>@{foundBot.name}</span>
              </div>
            </div>
            {foundBot.description && (
              <p className='cg-text-md-400 cg-text-secondary'>{foundBot.description}</p>
            )}
          </div>
        )}

        <div className='flex gap-2 justify-end mt-2'>
          <Button role='borderless' text='Cancel' onClick={handleClose} />
          <Button
            role='primary'
            text='Add Bot'
            onClick={handleAdd}
            disabled={!foundBot || adding}
          />
        </div>
      </div>
    </ScreenAwareModal>
  );
};

export default AddBotModal;

