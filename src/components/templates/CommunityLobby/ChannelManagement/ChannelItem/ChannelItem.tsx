// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import { Draggable } from "react-beautiful-dnd";
import "./ChannelItem.css";
import SettingsListItem from "components/atoms/SettingsListItem/SettingsListItem";
import { DotsSixVertical } from "@phosphor-icons/react";

type Props = {
    index: number;
    channel: Models.Community.Channel;
    onChannelEditClick: (channel: Models.Community.Channel) => void;
    selected?: boolean;
}

export default function ChannelItem(props: React.PropsWithChildren<Props>) {
    const { index, channel, onChannelEditClick, selected } = props;
    return (
        <Draggable
            draggableId={channel.channelId}
            index={index}
            key={channel.channelId}
        >
            {(provided, snapshot) => {
                const className = [
                    "channel-item",
                    snapshot.isDragging ? "dragging" : ""
                ].join(" ").trim();

                return (
                    <div
                        className={className}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <SettingsListItem
                            onClick={() => onChannelEditClick(channel)}
                            text={<>{channel.emoji || '💬'} {channel.title}</>}
                            iconLeft={<span className="flex" >
                                <DotsSixVertical className="w-5 h-5" />
                            </span>}
                            selected={selected}
                        />
                    </div>
                )
            }}
        </Draggable>
    )
}