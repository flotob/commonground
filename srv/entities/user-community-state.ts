// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    ManyToOne,
    JoinColumn,
    Column,
    PrimaryColumn,
} from "typeorm";
import { User } from "./users";
import { Community } from "./communities";
import {
    UserBlockState,
    CommunityApprovalState,
} from "../common/enums";

@Entity({ name: 'user_community_state' })
export class UserCommunityState {
    @PrimaryColumn({ type: 'uuid', nullable: false })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @PrimaryColumn({ type: 'uuid', nullable: false })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    blockStateUpdatedAt!: Date | null;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    blockStateUntil!: Date | null;

    @Column({ type: 'enum', enum: UserBlockState, nullable: true })
    blockState!: UserBlockState | null;

    @Column({ type: 'jsonb', nullable: true })
    questionnaireAnswers!: Models.Community.QuestionnaireAnswer[] | null;

    @Column({type: 'enum', enum: CommunityApprovalState, nullable: true })
    approvalState!: CommunityApprovalState | null;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    approvalUpdatedAt!: Date | null;

    @Column({ type: 'boolean', nullable: false, default: true })
    notifyMentions!: boolean;

    @Column({ type: 'boolean', nullable: false, default: true })
    notifyReplies!: boolean;

    @Column({ type: 'boolean', nullable: false, default: true })
    notifyPosts!: boolean;

    @Column({ type: 'boolean', nullable: false, default: true })
    notifyEvents!: boolean;
    
    @Column({ type: 'boolean', nullable: false, default: true })
    notifyCalls!: boolean;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    newsletterJoinedAt!: Date | null;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    newsletterLeftAt!: Date | null;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    userLeftCommunity!: Date | null;
}
