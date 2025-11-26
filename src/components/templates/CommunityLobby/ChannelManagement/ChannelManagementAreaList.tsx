// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLoadedCommunityContext } from 'context/CommunityProvider';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react'
import { DragDropContext, Draggable, DropResult, Droppable } from 'react-beautiful-dnd';
import AreaItem from './AreaItem/AreaItem';
import Button from 'components/atoms/Button/Button';
import data from 'data';

const BASE_ORDER_STEP = 1000000;
const NUKE_OPTION_THRESHOLD = 0.9;

type ChannelDict = {
  [areaId: string]: {
    textChannels: Models.Community.Channel[];
  }
}

export const findNewOrder: <T extends { order: number }>(items: T[]) => T[] = (oldItems) => {
  const itemsClone = _.cloneDeep(oldItems);

  function reassignOrder<T extends { order: number }>(items: T[], index: number) {
    // if first element set BASE_ORDER_STEP
    if (index === 0) {
      items[0].order = BASE_ORDER_STEP;

      // Sanity check
      const nextEl = items[1];
      if (nextEl && items[0].order >= nextEl.order) {
        reassignOrder(items, 1);
      }
      return;
    }

    // if last element, set max + 1000000
    if (index === items.length - 1) {
      const orders: number[] = items.map(item => isNaN(item.order) ? 0 : item.order);
      const maxOrder = Math.max(...orders);
      items[index].order = (maxOrder - maxOrder % BASE_ORDER_STEP) + BASE_ORDER_STEP;

      // Sanity check unneeded since we can always grow up
      return;
    }

    // If middle of array, use average of values
    const prevItem = items[index - 1];
    const nextItem = items[index + 1];

    // ceil so we always grow up
    const newOrder = Math.ceil((prevItem.order + nextItem.order) / 2);
    items[index].order = newOrder;

    // sanity check
    // reassign higher indexes first
    if (items[index].order >= items[index + 1].order) {
      reassignOrder(items, index + 1);
    }

    if (items[index - 1].order >= items[index].order) {
      reassignOrder(items, index - 1);
    }
  }

  function reassignAllOrders<T extends { order: number }>(items: T[]) {
    items.forEach((item, index) => {
      item.order = (index + 1) * BASE_ORDER_STEP;
    });
  }

  let ordersAreValid = false;
  while (!ordersAreValid) {
    ordersAreValid = true;

    for (let i = 0; i < itemsClone.length; i += 1) {
      const currItem = itemsClone[i];
      const prevItem = itemsClone[i - 1];
      if (prevItem && prevItem.order >= currItem.order) {
        reassignOrder(itemsClone, i);
        ordersAreValid = false;
        break;
      }
    }
  }

  // nuke option -> if changed rate is above threshhold
  // just update everything into good numbers to avoid future recalcs
  let numberChanged = 0;
  for (let i = 0; i < itemsClone.length; i += 1) {
    if (itemsClone[i].order !== oldItems[i].order) {
      numberChanged += 1;
    }
  }

  const changedRate = numberChanged / itemsClone.length;
  if (changedRate > NUKE_OPTION_THRESHOLD) {
    reassignAllOrders(itemsClone);
  }

  return itemsClone;
}

type Props = {
  onAreaEditClick: (area: Models.Community.Area) => void;
  onChannelEditClick: (channel: Models.Community.Channel) => void;
  onCreateChannelClick: (area: Models.Community.Area) => void;
  onCreateNewArea: () => void;
  selectedId?: string;
};

const ChannelManagementAreaList: React.FC<Props> = (props) => {
  const { onAreaEditClick, onChannelEditClick, onCreateChannelClick, onCreateNewArea, selectedId } = props;
  const { community, areas, channels } = useLoadedCommunityContext();
  const [channelsDict, setChannelsDict] = useState<ChannelDict>({});

  const [_areas, _setAreas] = useState<Models.Community.Area[]>([...areas]);
  const [expandedAreaIds, setExpandedAreaIds] = useState<string[]>([]);

  const handleAreaItemClick = (area: Models.Community.Area) => {
    if (expandedAreaIds.includes(area.id)) {
      const newExpandedIds = expandedAreaIds.filter(thisId => thisId !== area.id);
      setExpandedAreaIds(newExpandedIds);
    } else {
      setExpandedAreaIds([...expandedAreaIds, area.id]);
    }
  }

  const getAreaChannels = (areaId: string, channels: Readonly<Models.Community.Channel[]>) => {
    return channels.filter(channel => channel.areaId === areaId);
  }

  const _findNexOrder = (items: Pick<(Models.Community.Area | Models.Community.Channel), 'order'>[]): number => {
    if (!!items && items.length > 0) {
      const orders: number[] = items.map(item => isNaN(item.order) ? 0 : item.order);
      const maxOrder = Math.max(...orders);
      return (maxOrder - maxOrder % 1000000) + 1000000;
    }
    return 1000000;
  };

  const calculateMovedAreaOrder = useCallback((areas: Models.Community.Area[], previousAreaIndex: number, followingAreaIndex: number): number => {
    const previousAreaOrder = (previousAreaIndex >= 0) ? areas[previousAreaIndex].order : 0;
    const followingAreaOrder = (followingAreaIndex < areas.length) ? areas[followingAreaIndex].order : _findNexOrder(areas);
    const areaOrder = Math.round((previousAreaOrder + followingAreaOrder) / 2);
    return areaOrder;
  }, []);

  const calculateMovedChannelOrder = useCallback((channels: Models.Community.Channel[], previousChannelIndex: number, followingChannelIndex: number): number => {
    const previousChannelOrder = (previousChannelIndex >= 0) ? channels[previousChannelIndex].order : 0;
    const followingChannelOrder = (followingChannelIndex < channels.length) ? channels[followingChannelIndex].order : _findNexOrder(channels);
    const channelOrder = Math.round((previousChannelOrder + followingChannelOrder) / 2);
    return channelOrder;
  }, []);

  const updateAreaOrder = useCallback(async (prevAreas: Models.Community.Area[] | undefined, draggedArea: Models.Community.Area, sourceIndex: number, destinationIndex: number) => {
    if (prevAreas) {
      const prevIndex = destinationIndex > sourceIndex ? destinationIndex : destinationIndex - 1;
      const nextIndex = destinationIndex < sourceIndex ? destinationIndex : destinationIndex + 1;
      const movedAreaOrder = calculateMovedAreaOrder(prevAreas, prevIndex, nextIndex);
      const newDraggedArea = { ...draggedArea, order: movedAreaOrder };

      const updatedAreas = _.cloneDeep(prevAreas);
      updatedAreas.splice(sourceIndex, 1);
      updatedAreas.splice(destinationIndex, 0, newDraggedArea);
      const newAreas = findNewOrder(updatedAreas);

      _setAreas(newAreas);

      await data.community.updateArea(community.id, newDraggedArea.id, { order: movedAreaOrder });

      for (let i = 0; i < newAreas.length; i++) {
        const foundArea = prevAreas.find(prevArea => prevArea.id === newAreas[i].id);
        if (foundArea && foundArea.order !== newAreas[i].order) {
          await data.community.updateArea(community.id, newAreas[i].id, { order: newAreas[i].order });
        }
      }
    }
  }, [calculateMovedAreaOrder, community.id]);

  const updateChannelOrder = useCallback(async (areaId: string, prevChannels: Models.Community.Channel[] | undefined, draggedChannel: Models.Community.Channel, sourceIndex: number, destinationIndex: number) => {
    if (prevChannels) {
      const prevIndex = destinationIndex > sourceIndex ? destinationIndex : destinationIndex - 1;
      const nextIndex = destinationIndex < sourceIndex ? destinationIndex : destinationIndex + 1;
      const movedChannelOrder = calculateMovedChannelOrder(prevChannels, prevIndex, nextIndex);
      const newDraggedChannel = { ...draggedChannel, order: movedChannelOrder };

      const updatedChannels = _.cloneDeep(prevChannels);
      updatedChannels.splice(sourceIndex, 1);
      updatedChannels.splice(destinationIndex, 0, newDraggedChannel);
      const newChannels = findNewOrder(updatedChannels);

      const newChannelsDict = _.cloneDeep(channelsDict);
      newChannelsDict[areaId].textChannels = newChannels;
      setChannelsDict(newChannelsDict);

      await data.community.updateChannel(community.id, newDraggedChannel.channelId, { order: movedChannelOrder, areaId });

      for (let i = 0; i < newChannels.length; i++) {
        const foundChannel = prevChannels.find(prevChannel => prevChannel.channelId === newChannels[i].channelId);
        if (foundChannel && foundChannel.order !== newChannels[i].order) {
          await data.community.updateChannel(community.id, newChannels[i].channelId, { order: newChannels[i].order, areaId });
        }
      }
    }
  }, [calculateMovedChannelOrder, channelsDict, community.id]);

  const onAreaDragEnd = useCallback(async (result: DropResult, draggedArea: Models.Community.Area) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    // check if location of draggable didn't change
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (draggedArea) {
      await updateAreaOrder(_areas, draggedArea, source.index, destination.index);
    }
  }, [_areas, updateAreaOrder]);

  const onChannelDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }

    // check if location of draggable didn't change
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const originalAreaId = source.droppableId.split('|')[0];
    const newAreaId = destination.droppableId.split('|')[0];

    if (originalAreaId && newAreaId) {
      const originalAreaChannels = getAreaChannels(originalAreaId, channels);
      const draggedChannel = originalAreaChannels?.find((channel) => channel?.channelId === draggableId);

      if (draggedChannel) {
        const newAreaTextChannels = channelsDict[newAreaId].textChannels;
        await updateChannelOrder(newAreaId, newAreaTextChannels, draggedChannel, source.index, destination.index);
      }
    }
  }, [channels, updateChannelOrder, channelsDict]);

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, type } = result;

    if (type === "areas") {
      const foundArea = _areas?.find(area => area.id === draggableId);
      if (foundArea) {
        await onAreaDragEnd(result, foundArea);
      }

    } else {
      await onChannelDragEnd(result);
    }
  }

  useEffect(() => {
    _setAreas([...areas]);
    const newChannelsDict: ChannelDict = {};
    if (!!channels && !!areas) {
      areas.forEach(area => {
        const mappedChannels = {
          textChannels: channels.filter(channel => channel.areaId === area.id).sort((a, b) => a.order - b.order),
        }
        if (newChannelsDict[area.id]) {
          newChannelsDict[area.id] = mappedChannels;
        } else {
          newChannelsDict[area.id] = {
            textChannels: mappedChannels.textChannels,
          }
        }
      });
    }
    setChannelsDict(newChannelsDict);
  }, [areas, channels]);

  return (<DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId={community.id} type="areas">
      {(provided) => (
        <div
          ref={provided.innerRef}
          className="management-area"
        >
          <div className="area-panel">
            <div
              className="panel-list"
            >
              {_areas && _areas.map((area, index) => {
                const expanded = expandedAreaIds.includes(area.id);
                const sortedTextChannels = channelsDict[area.id]?.textChannels;
                return (
                  <Draggable
                    key={area.id}
                    draggableId={area.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <AreaItem
                          key={area.id}
                          area={area}
                          expanded={expanded}
                          sortedTextChannels={sortedTextChannels}
                          onAreaClick={handleAreaItemClick}
                          onAreaEditClick={onAreaEditClick}
                          onChannelEditClick={onChannelEditClick}
                          onCreateChannelClick={onCreateChannelClick}
                          dragging={snapshot.isDragging}
                          draggableHandlerProps={provided.dragHandleProps}
                          selectedId={selectedId}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>

            <Button
              text="+ New area"
              onClick={onCreateNewArea}
              role="chip"
              className="mt-6"
            />
          </div>
        </div>
      )}
    </Droppable>
  </DragDropContext>
  )
}

export default React.memo(ChannelManagementAreaList);