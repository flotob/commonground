// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Index, Column } from "typeorm";
import { User } from "./users";
import { Channel } from "./channels"

@Entity({ name: 'channelreadstate' })
export class ChannelReadState {
    @PrimaryColumn({ type: 'uuid'})
    channelId!: string;

    @ManyToOne(() => Channel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn([{
        name: 'channelId',
        referencedColumnName: 'id'
    }])
    channel!: Channel;

    @Index()
    @PrimaryColumn({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @Column({ type: 'timestamptz', precision: 3, nullable: false, default: () => 'now()' })
    lastRead!: Date;
}
