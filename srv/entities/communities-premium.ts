// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Column,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { Community } from "./communities";
import { CommunityPremiumFeatureName, PremiumRenewal } from "../common/enums";

@Entity({ name: 'communities_premium' })
export class CommunityPremium {
  @PrimaryColumn({ type: 'uuid' })
  communityId!: string;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;

  @PrimaryColumn({ type: 'enum', enum: CommunityPremiumFeatureName })
  featureName!: Models.Community.PremiumName;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: false })
  activeUntil!: Date;

  @Index()
  @Column({ type: 'enum', enum: PremiumRenewal, nullable: true })
  autoRenew!: Common.PremiumRenewal | null;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;
}