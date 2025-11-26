// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    ManyToOne,
    JoinColumn,
    Column,
    Index,
    CreateDateColumn,
    DeleteDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    OneToMany
} from "typeorm";
import { Community } from "./communities";
import { CommunityChannel } from "./communities-channels";

@Entity({ name: 'areas' })
export class Area {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @OneToMany(() => CommunityChannel, (communityChannel) => communityChannel.area)
    communityChannels!: CommunityChannel[];

    @Column({ type: 'varchar', length: 100, nullable: false })
    title!: string;

    @Column({ type: 'integer', nullable: false, default: 0 })
    order!: number;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}
