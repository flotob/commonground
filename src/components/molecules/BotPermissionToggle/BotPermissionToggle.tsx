// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import './BotPermissionToggle.css';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import ListItem from 'components/atoms/ListItem/ListItem';
import ScreenAwareDropdown from 'components/atoms/ScreenAwareDropdown/ScreenAwareDropdown';
import { Robot, Eye, ChatText, ShieldCheck, Prohibit } from '@phosphor-icons/react';
import Jdenticon from 'components/atoms/Jdenticon/Jdenticon';
import BotBadge from 'components/atoms/BotBadge/BotBadge';

type BotPermissionLevel = Models.Bot.BotChannelPermissionLevel;

// Bot info for the permission toggle
export type BotForPermissions = {
  id: string;
  name: string;
  displayName: string;
  avatarId: string | null;
};

type Props = {
  title?: string;
  subtitle?: string;
  bots: BotForPermissions[];
  botPermissions: Record<string, BotPermissionLevel>;
  setBotPermissions: React.Dispatch<React.SetStateAction<Record<string, BotPermissionLevel>>>;
};

const availablePermissions: BotPermissionLevel[] = ['no_access', 'mentions_only', 'full_access', 'moderator'];

export function permissionToTitle(permission: BotPermissionLevel): string {
  switch (permission) {
    case 'no_access': return 'No Access';
    case 'mentions_only': return 'Mentions Only';
    case 'full_access': return 'Full Access';
    case 'moderator': return 'Moderator';
    default: return 'Full Access';
  }
}

export function BotPermissionIcon({ permission }: { permission: BotPermissionLevel }) {
  const className = 'w-5 h-5';
  switch (permission) {
    case 'no_access': return <Prohibit className={className} />;
    case 'mentions_only': return <Eye className={className} />;
    case 'full_access': return <ChatText className={className} />;
    case 'moderator': return <ShieldCheck className={className} />;
    default: return <ChatText className={className} />;
  }
}

const BotPermissionToggle: React.FC<Props> = (props) => {
  const { title, subtitle, bots, botPermissions, setBotPermissions } = props;

  if (bots.length === 0) {
    return (
      <div className='flex flex-col gap-4 w-full'>
        <div className='flex flex-col'>
          {title && <span className='cg-text-lg-500 cg-text-main'>{title}</span>}
          {subtitle && <span className='cg-text-md-400 cg-text-secondary'>{subtitle}</span>}
        </div>
        <div className='cg-separator' />
        <div className='flex items-center gap-2 p-3 cg-bg-surface-subtle cg-border-l'>
          <Robot className='w-5 h-5 cg-text-secondary' />
          <span className='cg-text-md-400 cg-text-secondary'>
            No bots installed in this community yet.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 w-full'>
      <div className='flex flex-col'>
        {title && <span className='cg-text-lg-500 cg-text-main'>{title}</span>}
        {subtitle && <span className='cg-text-md-400 cg-text-secondary'>{subtitle}</span>}
      </div>
      <div className='cg-separator' />
      <BotPermissionToggleUnit
        bot={{ id: '__all__', name: 'all', displayName: 'Set for all bots', avatarId: null }}
        selectedPermission='full_access'
        setBotPermissions={setBotPermissions}
        forcedTriggerTitle='Select'
        forcedSetBotPermissions={(permission) => {
          const allPermissions = bots.reduce((acc, bot) => ({ ...acc, [bot.id]: permission }), {} as Record<string, BotPermissionLevel>);
          setBotPermissions(old => ({
            ...old,
            ...allPermissions
          }));
        }}
      />
      <div className='flex flex-col gap-1'>
        <span className='cg-text-sm-500 cg-text-secondary uppercase tracking-wide'>Installed Bots</span>
        {bots.map(bot => (
          <BotPermissionToggleUnit
            key={bot.id}
            bot={bot}
            selectedPermission={botPermissions[bot.id] || 'full_access'}
            setBotPermissions={setBotPermissions}
          />
        ))}
      </div>
    </div>
  );
};

type UnitProps = {
  bot: BotForPermissions;
  selectedPermission: BotPermissionLevel;
  setBotPermissions: React.Dispatch<React.SetStateAction<Record<string, BotPermissionLevel>>>;
  forcedTriggerTitle?: string;
  forcedSetBotPermissions?: (permission: BotPermissionLevel) => void;
};

const BotPermissionToggleUnit: React.FC<UnitProps> = (props) => {
  const { bot, selectedPermission, setBotPermissions, forcedTriggerTitle, forcedSetBotPermissions } = props;

  const trigger = forcedTriggerTitle ? (
    <div className='flex gap-1 p-2 cg-text-md-500 cg-text-secondary items-center w-fit cg-hoverable-w-bg cg-border-l cursor-pointer'>
      <span>{forcedTriggerTitle}</span>
      <ChevronDownIcon className='h-5 w-5' />
    </div>
  ) : (
    <div className='flex gap-1 p-2 cg-text-md-500 items-center w-fit cg-hoverable-w-bg cg-border-l cursor-pointer'>
      <BotPermissionIcon permission={selectedPermission} />
      <span>{permissionToTitle(selectedPermission)}</span>
      <ChevronDownIcon className='h-5 w-5' />
    </div>
  );

  const items = availablePermissions.map(permission => {
    const onClick = forcedSetBotPermissions
      ? () => forcedSetBotPermissions(permission)
      : () => setBotPermissions(old => ({ ...old, [bot.id]: permission }));

    return (
      <ListItem
        key={permission}
        title={permissionToTitle(permission)}
        icon={<BotPermissionIcon permission={permission} />}
        onClick={onClick}
        selected={selectedPermission === permission}
        propagateEventsOnClick
      />
    );
  });

  return (
    <div className='bot-permission-toggle-unit'>
      <div className='flex items-center gap-2 flex-1 whitespace-nowrap overflow-hidden'>
        {bot.id !== '__all__' && (
          <Jdenticon
            userId={bot.id}
            defaultImageId={bot.avatarId}
            predefinedSize='24'
            hideStatus
          />
        )}
        <span className='title-text overflow-hidden text-ellipsis'>
          {bot.displayName}
        </span>
        {bot.id !== '__all__' && <BotBadge />}
      </div>
      <ScreenAwareDropdown
        triggerContent={trigger}
        items={items}
      />
    </div>
  );
};

export default BotPermissionToggle;

