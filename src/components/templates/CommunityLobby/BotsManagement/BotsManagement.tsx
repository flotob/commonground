// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './BotsManagement.css';
import React, { useCallback, useEffect, useState } from 'react';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { useLoadedCommunityContext } from 'context/CommunityProvider';
import { useNavigate } from 'react-router-dom';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { useSnackbarContext } from 'context/SnackbarContext';
import { getUrl } from 'common/util';
import ManagementHeader2 from 'components/molecules/ManagementHeader2/ManagementHeader2';
import SimpleLink from 'components/atoms/SimpleLink/SimpleLink';
import BotManagementList from './BotManagementList';
import BotEditor from './BotEditor';
import botsApi from 'data/api/bots';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import { Clipboard } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import AddBotModal from './AddBotModal';

const sdkUrl = 'https://github.com/Common-Ground-DAO/cg-bot-sdk';

type Props = {};

// Bot info type from API
export interface BotInfo {
  id: string;
  name: string;
  displayName: string;
  avatarId: string | null;
  description: string | null;
  ownerUserId: string;
  webhookUrl: string | null;
}

// Community bot type (flat structure from API - bot fields merged with community_bot fields)
export interface CommunityBotInfo extends BotInfo {
  channelPermissions: Record<string, Models.Bot.BotChannelPermissionLevel>;
  addedByUserId: string;
  config: Record<string, any>;
}

type SubProps = Props & {
  communityBots: CommunityBotInfo[];
  setCommunityBots: React.Dispatch<React.SetStateAction<CommunityBotInfo[]>>;
  selectedBotId: string;
  setSelectedBotId: (value: string) => void;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  isAddingBot: boolean;
  setIsAddingBot: (value: boolean) => void;
  currentBot: BotInfo | null;
  setCurrentBot: React.Dispatch<React.SetStateAction<BotInfo | null>>;
  onCreateBot: () => void;
  onAddBot: () => void;
  refreshBots: () => void;
};

const BotsManagement: React.FC<Props> = (props) => {
  const { isMobile } = useWindowSizeContext();
  const { community } = useLoadedCommunityContext();
  const { showSnackbar } = useSnackbarContext();
  const [communityBots, setCommunityBots] = useState<CommunityBotInfo[]>([]);
  const [selectedBotId, setSelectedBotId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [currentBot, setCurrentBot] = useState<BotInfo | null>(null);
  const [savedModalData, setSavedModalData] = useState<{
    name: string;
    token: string;
    webhookSecret: string | null;
  } | null>(null);

  // Fetch community bots
  const refreshBots = useCallback(async () => {
    try {
      const response = await botsApi.getCommunityBots({ communityId: community.id });
      if (response.bots) {
        setCommunityBots(response.bots);
      }
    } catch (e) {
      console.error('Failed to fetch community bots:', e);
    }
  }, [community.id]);

  useEffect(() => {
    refreshBots();
  }, [refreshBots]);

  // Select a bot from the list
  useEffect(() => {
    if (selectedBotId && !isCreating) {
      const found = communityBots.find(cb => cb.id === selectedBotId);
      if (found) {
        setCurrentBot(found);
      }
    } else if (!selectedBotId && !isCreating) {
      setCurrentBot(null);
    }
  }, [selectedBotId, communityBots, isCreating]);

  const onCreateBot = useCallback(() => {
    setIsCreating(true);
    setSelectedBotId('');
    setCurrentBot({
      id: '',
      name: '',
      displayName: '',
      avatarId: null,
      description: null,
      ownerUserId: '',
      webhookUrl: null,
    });
  }, []);

  const onAddBot = useCallback(() => {
    setIsAddingBot(true);
  }, []);

  const handleBotCreated = useCallback((data: { name: string; token: string; webhookSecret: string | null }) => {
    setSavedModalData(data);
    setIsCreating(false);
    setSelectedBotId('');
    refreshBots();
  }, [refreshBots]);

  const handleBotAdded = useCallback(() => {
    setIsAddingBot(false);
    refreshBots();
    showSnackbar({ type: 'success', text: 'Bot added to community' });
  }, [refreshBots, showSnackbar]);

  const subProps: SubProps = {
    communityBots,
    setCommunityBots,
    selectedBotId,
    setSelectedBotId,
    isCreating,
    setIsCreating,
    isAddingBot,
    setIsAddingBot,
    currentBot,
    setCurrentBot,
    onCreateBot,
    onAddBot,
    refreshBots,
  };

  if (isMobile) {
    return <>
      <BotsManagementMobile {...subProps} onBotCreated={handleBotCreated} />
      <SavedModal onClose={() => setSavedModalData(null)} data={savedModalData} />
      <AddBotModal 
        isOpen={isAddingBot} 
        onClose={() => setIsAddingBot(false)} 
        onBotAdded={handleBotAdded}
        communityId={community.id}
      />
    </>;
  } else {
    return <>
      <BotsManagementDesktop {...subProps} onBotCreated={handleBotCreated} />
      <SavedModal onClose={() => setSavedModalData(null)} data={savedModalData} />
      <AddBotModal 
        isOpen={isAddingBot} 
        onClose={() => setIsAddingBot(false)} 
        onBotAdded={handleBotAdded}
        communityId={community.id}
      />
    </>;
  }
};

const BotsManagementDesktop: React.FC<SubProps & { onBotCreated: (data: { name: string; token: string; webhookSecret: string | null }) => void }> = (props) => {
  const {
    communityBots,
    currentBot,
    setCurrentBot,
    isCreating,
    setIsCreating,
    selectedBotId,
    setSelectedBotId,
    onCreateBot,
    onAddBot,
    refreshBots,
    onBotCreated,
  } = props;

  return (
    <div className='bots-management-desktop'>
      <ManagementHeader2
        title='Bots'
        help={
          <span>
            Bots are automated agents that can send and receive messages in your community channels.
            Add existing bots by their ID, or create your own using our SDK.
            <br /><br />
            Check out our <SimpleLink href={sdkUrl} className='underline cursor-pointer'>Bot SDK</SimpleLink> to build your own bot.
          </span>
        }
      />
      <div className='flex flex-col gap-1 cg-bg-brand-subtle cg-border-brand cg-text-main cg-border-xl p-4 max-w-[400px]'>
        <h3 className='cg-text-brand cg-text-lg-500'>Want to build your own bot?</h3>
        <p>
          Check out our <SimpleLink href={sdkUrl} className='underline cursor-pointer'>Bot SDK</SimpleLink> to build bots that can interact with Common Ground channels.
        </p>
      </div>
      <div className='bots-management-desktop-content'>
        <BotManagementList
          communityBots={communityBots}
          selectedId={selectedBotId}
          isCreating={isCreating}
          onCreateBot={onCreateBot}
          onAddBot={onAddBot}
          onSelectBot={setSelectedBotId}
        />
        {(isCreating || selectedBotId) && currentBot && (
          <BotEditor
            key={currentBot.id || 'new'}
            bot={currentBot}
            setBot={setCurrentBot}
            isCreating={isCreating}
            onCancel={() => {
              setIsCreating(false);
              setSelectedBotId('');
            }}
            onBotCreated={onBotCreated}
            onBotRemoved={() => {
              setSelectedBotId('');
              refreshBots();
            }}
          />
        )}
      </div>
    </div>
  );
};

const BotsManagementMobile: React.FC<SubProps & { onBotCreated: (data: { name: string; token: string; webhookSecret: string | null }) => void }> = (props) => {
  const navigate = useNavigate();
  const { community } = useLoadedCommunityContext();
  const {
    communityBots,
    currentBot,
    setCurrentBot,
    isCreating,
    setIsCreating,
    selectedBotId,
    setSelectedBotId,
    onCreateBot,
    onAddBot,
    refreshBots,
    onBotCreated,
  } = props;

  const goBack = useCallback(() => {
    if (selectedBotId || isCreating) {
      setSelectedBotId('');
      setIsCreating(false);
    } else {
      navigate(getUrl({ type: 'community-settings', community }));
    }
  }, [community, navigate, selectedBotId, isCreating, setSelectedBotId, setIsCreating]);

  let title = 'Bots';
  if (isCreating) {
    title = 'Create Bot';
  } else if (selectedBotId) {
    title = 'Manage Bot';
  }

  return (
    <div className='bots-management-mobile'>
      <ManagementHeader2
        goBack={goBack}
        title={title}
        help={
          <span>
            Bots are automated agents that can send and receive messages in your community channels.
            <br /><br />
            Check out our <SimpleLink href={sdkUrl} className='underline cursor-pointer'>Bot SDK</SimpleLink> to build your own bot.
          </span>
        }
      />
      <Scrollable>
        {!selectedBotId && !isCreating && (
          <div className='flex flex-col gap-1 cg-bg-brand-subtle cg-border-brand cg-text-main cg-border-xl p-4 mx-4'>
            <h3 className='cg-text-brand cg-text-lg-500'>Want to build your own bot?</h3>
            <p>
              Check out our <SimpleLink href={sdkUrl} className='underline cursor-pointer'>Bot SDK</SimpleLink> to build bots that can interact with Common Ground channels.
            </p>
          </div>
        )}
        <div className='p-4'>
          {!selectedBotId && !isCreating && (
            <BotManagementList
              communityBots={communityBots}
              selectedId={selectedBotId}
              isCreating={isCreating}
              onCreateBot={onCreateBot}
              onAddBot={onAddBot}
              onSelectBot={setSelectedBotId}
            />
          )}
          {(isCreating || selectedBotId) && currentBot && (
            <BotEditor
              key={currentBot.id || 'new'}
              bot={currentBot}
              setBot={setCurrentBot}
              isCreating={isCreating}
              onCancel={() => {
                setIsCreating(false);
                setSelectedBotId('');
              }}
              onBotCreated={onBotCreated}
              onBotRemoved={() => {
                setSelectedBotId('');
                refreshBots();
              }}
            />
          )}
        </div>
      </Scrollable>
    </div>
  );
};

// Modal shown after creating a bot with token info
const SavedModal: React.FC<{
  onClose: () => void;
  data: { name: string; token: string; webhookSecret: string | null } | null;
}> = ({ onClose, data }) => {
  const { showSnackbar } = useSnackbarContext();

  return (
    <ScreenAwareModal isOpen={!!data} onClose={onClose}>
      <div className='flex flex-col items-center gap-4'>
        <h3 className='text-center'>
          Bot "<span className='font-bold'>{data?.name}</span>" created!
        </h3>
        <h4 className='text-center'>
          Copy the token below to use in your bot. This is the only time it will be shown.
        </h4>
        <h4 className='cg-text-warning text-center'>
          Keep this token secret! Anyone with it can act as your bot.
        </h4>
        <div className='flex flex-col gap-2 cg-content-stack p-4 cg-border-xl max-w-full w-full'>
          <div className='flex gap-2 items-center'>
            <Button
              role='chip'
              className='p-4 w-full'
              iconLeft={<Clipboard weight='duotone' className='w-6 h-6' />}
              text='Copy Bot Token'
              onClick={() => {
                navigator.clipboard.writeText(data?.token || '');
                showSnackbar({ type: 'info', text: 'Bot token copied to clipboard' });
              }}
            />
          </div>
          {data?.webhookSecret && (
            <div className='flex gap-2 items-center'>
              <Button
                role='chip'
                className='p-4 w-full'
                iconLeft={<Clipboard weight='duotone' className='w-6 h-6' />}
                text='Copy Webhook Secret'
                onClick={() => {
                  navigator.clipboard.writeText(data?.webhookSecret || '');
                  showSnackbar({ type: 'info', text: 'Webhook secret copied to clipboard' });
                }}
              />
            </div>
          )}
        </div>
        <Button role='primary' text='Done' onClick={onClose} />
      </div>
    </ScreenAwareModal>
  );
};

export default React.memo(BotsManagement);

