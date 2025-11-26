// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Community } from "./communities";
import { User } from "./users";
import { Role } from "./roles";

@Entity({ name: 'user_community_airdrops' })
export class UserCommunityAirdrop {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @Column({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({
        name: 'roleId',
        referencedColumnName: 'id'
    })
    role!: Role;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @Column({ type: 'jsonb', nullable: false })
    airdropData!: Models.Community.UserAirdropData;

    @Column({ type: 'timestamptz', precision: 3, select: false, nullable: false })
    airdropEndDate!: string;
}
