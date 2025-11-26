// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    ManyToOne,
    JoinColumn,
    Column,
    PrimaryColumn,
    Index,
    UpdateDateColumn,
} from "typeorm";
import { ChannelNotificationTypeEnum, ChannelPinTypeEnum } from "../common/enums";
import { CommunityChannel } from "./communities-channels";
import { User } from "./users";

@Entity({ name: 'user_channel_settings' })
export class UserChannelSettings {
    @Index()
    @PrimaryColumn({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @PrimaryColumn({ type: 'uuid' })
    channelId!: string;

    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => CommunityChannel, { onDelete: 'CASCADE' })
    @JoinColumn([{
        name: 'communityId',
        referencedColumnName: 'communityId',
    }, {
        name: 'channelId',
        referencedColumnName: 'channelId',
    }])
    communityChannel!: CommunityChannel;

    @Column({ type: 'enum', enum: ChannelPinTypeEnum, default: ChannelPinTypeEnum.AUTOPIN })
    pinType!: ChannelPinTypeEnum;

    @Column({ type: 'enum', enum: ChannelNotificationTypeEnum, default: ChannelNotificationTypeEnum.WHILE_PINNED })
    notifyType!: ChannelNotificationTypeEnum;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    pinnedUntil!: Date | null;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3 })
    updatedAt!: Date;
}
