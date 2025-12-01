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
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Community } from "./communities";
import { Bot } from "./bots";
import { User } from "./users";

@Entity({ name: 'community_bots' })
export class CommunityBot {
    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @PrimaryColumn({ type: 'uuid' })
    botId!: string;

    @Index()
    @ManyToOne(() => Bot, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'botId',
        referencedColumnName: 'id'
    })
    bot!: Bot;

    @Column({ type: 'uuid', nullable: false })
    addedByUserId!: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({
        name: 'addedByUserId',
        referencedColumnName: 'id'
    })
    addedBy!: User;

    @Column({ type: 'jsonb', nullable: false, default: '{}' })
    config!: Record<string, any>;

    /**
     * Per-channel permissions for this bot
     * Key: channelId, Value: permission level
     * Missing channels = no_access (default)
     */
    @Column({ type: 'jsonb', nullable: false, default: '{}' })
    channelPermissions!: Record<string, Models.Bot.BotChannelPermissionLevel>;

    @CreateDateColumn({ type: 'timestamptz', precision: 3 })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3 })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3 })
    deletedAt!: Date | null;
}

