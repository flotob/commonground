// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './EcosystemHomeHeader.css';
import { HouseSimple } from '@phosphor-icons/react';
import ExternalIcon from 'components/atoms/ExternalIcon/ExternalIcon';
import { getEcosystemName, getEcosystemNameString } from 'components/molecules/EcosystemPicker/EcosystemPicker';
import React, { useEffect, useRef, useState } from 'react'
import { HomeChannelTypes } from 'views/Home/Home';
import { ecosystemHeaderData } from './EcosystemHomeHeader.data';
import Button from 'components/atoms/Button/Button';
import { useAsyncMemo } from 'hooks/useAsyncMemo';
import communityApi from 'data/api/community';
import { getCommunityDisplayName } from '../../../util';
import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import { useCreateCommunityModalContext } from 'context/CreateCommunityModalProvider';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { getUrl } from 'common/util';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import useLocalStorage from 'hooks/useLocalStorage';
import { SELECTED_CHANNELS_LOCAL_STORAGE } from '../EcosystemMenu/EcosystemMenu';
import { useSnackbarContext } from 'context/SnackbarContext';

type Props = {
  channel: HomeChannelTypes;
};

const EcosystemHomeHeader: React.FC<Props> = (props) => {
  const { channel } = props;
  const { setVisible } = useCreateCommunityModalContext();
  const { isMobile } = useWindowSizeContext();
  const { showSnackbar } = useSnackbarContext();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [communityCounts, setCommunityCounts] = useState<Partial<Record<HomeChannelTypes, number>>>({});
  const [availableChannels, setAvailableChannels] = useLocalStorage<HomeChannelTypes[]>([], SELECTED_CHANNELS_LOCAL_STORAGE);
  
  const data = ecosystemHeaderData[channel];
  const currentCount = communityCounts[channel];
  const channelJoined = availableChannels.includes(channel);

  const topCommunities = useAsyncMemo(async () => {
    if (!channel) return [];
    return communityApi.getCommunityList({
      sort: 'popular',
      tags: [channel],
      offset: 0,
      limit: 2,
    })
  }, [channel], { nullValueOnChange: true });

  // Resize listener
  useEffect(() => {
    const listener: ResizeObserverCallback = async ([entry]) => {
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    }

    const observer = new ResizeObserver(listener);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, [channel]);

  useEffect(() => {
    if (!!channel && channel !== 'following' && (currentCount === undefined)) {
      communityApi.getCommunityCount({channel}).then(result => {
        setCommunityCounts(communityCounts => ({
          ...communityCounts,
          [channel]: result.count
        }));
      });
    }
  }, [channel, currentCount]);

  if (!channel || channel === 'following') return null;

  const className = [
    'ecosystem-home-header flex flex-col w-full cg-text-main relative',
    collapsed ? 'collapsed' : ''
  ].join(' ').trim();

  return (<div className='ecosystem-home-header-container cg-content-stack overflow-hidden' style={{ height: containerHeight }}>
    <div className={className} ref={contentRef}>
      <div className='flex flex-col'>
        <div className='ecosystem-home-header-img-bg'>
          <ExternalIcon type={channel} />
        </div>
        {!collapsed && <div className='ecosystem-home-header-img-main'>
          <ExternalIcon type={channel} />
        </div>}
        <div className='ecosystem-home-header-title flex p-4 gap-2 justify-between'>
          <div className='flex items-center gap-1'>
            <ExternalIcon type={channel} className='w-5 h-5' />
            <h3 className='flex-1'>{getEcosystemName(channel)}</h3>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1 cg-text-secondary'>
              <span>{communityCounts[channel] === undefined ? '...' : communityCounts[channel]}</span>
              <HouseSimple className='w-6 h-6' />
            </div>
            {!collapsed && !channelJoined && <Button 
              role='primary'
              text='Follow'
              onClick={() => {
                setAvailableChannels(old => [...old, channel]);
                showSnackbar({type: 'success', text: `You are now following ${getEcosystemNameString(channel)}`});
              }}
            />}
            <div className='ecosystem-home-header-collapse-btn cg-bg-subtle p-2 cg-circular flex items-center justify-center cursor-pointer' role='button' onClick={() => setCollapsed(old => !old)}>
              <ChevronUpIcon className={`w-6 h-6 transition-all ${collapsed ? ' rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </div>
      {!collapsed && <div className='flex flex-col p-4 gap-4'>
        <span className='cg-text-secondary whitespace-pre-line'>{data?.description}</span>
        <div className='flex gap-2 items-center flex-wrap'>
          {data?.links.map(link => <Button
            key={link.title}
            role='chip'
            text={link.title}
            onClick={() => window.open(link.url, '_blank', 'noreferrer')}
          />)}
        </div>
        <div className='flex flex-col gap-2'>
          {!topCommunities && <div className='w-full h-72 skeleton-box ecosystem-home-placeholder cg-border-xxl' />}
          {!!topCommunities && topCommunities?.length > 0 && <>
            <span className='cg-text-md-500 cg-text-secondary'>Top Communities</span>
            <div className='grid grid-cols-2 gap-2'>
              {topCommunities?.map(comm => <div className='flex flex-col gap-2 p-2 cg-border-xl cg-bg-subtle cursor-pointer' key={comm.id} onClick={() => navigate(getUrl({type: 'community-lobby', community: comm}))}>
                <div className='flex items-center gap-1'>
                  <CommunityPhoto community={comm} size='tiny' noHover />
                  {getCommunityDisplayName(comm)}
                </div>
                {comm.shortDescription && <span className='cg-text-sm-400 cg-text-secondary'>{comm.shortDescription}</span>}
                <span className='cg-text-sm-400 cg-text-secondary'>{comm.memberCount} Members</span>
              </div>)}
            </div>
            <Button
              role='chip'
              className='w-fit'
              iconLeft={<HouseSimple className='w-5 h-5' />}
              text='Show more communities'
              onClick={() => navigate({
                pathname: getUrl({ type: 'browse-communities' }),
                search: createSearchParams({ channel }).toString()
              })}
            />
          </>}
          {!!topCommunities && (communityCounts[channel] ?? 999) < 10 && <div className='flex flex-col cg-bg-subtle items-center cg-border-xxl pt-8'>
            <div className='ecosystem-home-empty-communities-img' />
            <div className='flex flex-col gap-4 py-4 px-6 items-center justify-center'>
              <div className='flex flex-col gap-1 items-center'>
                <h3>It’s quiet here — build a community, earn rewards 🔥</h3>
                <span className='cg-text-secondary cg-text-lg-500'>The first 10 thriving communities in a channel earn Spark rewards</span>
              </div>
              <div className={`grid gap-2 max-w-xl ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className='cg-bg-subtle cg-border-l flex p-2 gap-2'>
                  <span className='cg-text-md-500'>1</span>
                  <span className='cg-text-md-400 cg-text-secondary'>Create a community and invite others</span>
                </div>

                <div className='cg-bg-subtle cg-border-l flex p-2 gap-2'>
                  <span className='cg-text-md-500'>2</span>
                  <span className='cg-text-md-400 cg-text-secondary'>Be active, no bots or forced activity!</span>
                </div>

                <div className='cg-bg-subtle cg-border-l flex p-2 gap-2'>
                  <span className='cg-text-md-500'>3</span>
                  <span className='cg-text-md-400 cg-text-secondary'>Collect 100k Spark, valued at 100$</span>
                </div>
              </div>
              <Button
                role='primary'
                text='Create a community'
                onClick={() => setVisible(true)}
              />
            </div>
          </div>}
        </div>
      </div>}
    </div>
  </div>);
}

export default React.memo(EcosystemHomeHeader);