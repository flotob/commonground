// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import EcosystemChip from 'components/atoms/EcosystemChip/EcosystemChip';
import ExternalIcon from 'components/atoms/ExternalIcon/ExternalIcon';
import { simpleChannels } from 'components/organisms/EcosystemMenu/EcosystemMenu';
import { ecosystems, } from 'context/EcosystemProvider';
import React from 'react';
import { HomeChannelTypes } from 'views/Home/Home';

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const channels = [...ecosystems, ...simpleChannels];

export const getCurrentEcosystem = (tags: string[]): HomeChannelTypes | null => {
  return (tags.find(tag => channels.includes(tag as any)) as HomeChannelTypes) || null;
}

const EcosystemPickerField: React.FC<Props> = (props) => {
  const { tags, onChange } = props;
  const activeChannel = getCurrentEcosystem(tags);

  const onEcosystemClick = (channel: string) => {
    const newTags = tags.filter(tag => !channels.includes(tag as any));
    // Only add if different, otherwise user is just toggling
    if (channel && channel !== activeChannel) {
      newTags.push(channel);
    }
    onChange(newTags);
  }

  return (<div className='flex flex-col self-stretch gap-2'>
    <div className='flex flex-col'>
      <span className='cg-text-main cg-text-lg-500'>Join a channel</span>
      <span className='cg-text-secondary cg-text-md-400'>Become part of an ecosystem of communities like yours! Your community will be listed as part of the channel, and your content will be shown there if you buy the publish community upgrade.</span>
    </div>
    <div className='flex items-center justify-start self-stretch gap-2 flex-wrap'>
      <EcosystemChip
        channel={null}
        text='None'
        selected={!activeChannel}
        onClick={() => onEcosystemClick('')}
      />
      {ecosystems.map(ecosystem => <EcosystemChip
        key={ecosystem}
        channel={ecosystem}
        iconLeft={<ExternalIcon type={ecosystem} className='w-5 h-5' />}
        onClick={() => onEcosystemClick(ecosystem)}
        selected={ecosystem === activeChannel}
      />)}
      {simpleChannels.map(channel => <EcosystemChip
        key={channel}
        channel={channel}
        iconLeft={<ExternalIcon type={channel} className='w-5 h-5' />}
        onClick={() => onEcosystemClick(channel)}
        selected={channel === activeChannel}
      />)}
    </div>
  </div>);
}

export default React.memo(EcosystemPickerField);