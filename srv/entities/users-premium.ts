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
import { PremiumRenewal, UserPremiumFeatureName } from "../common/enums";
import { User } from "./users";

@Entity({ name: 'users_premium' })
export class UserPremium {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @PrimaryColumn({ type: 'enum', enum: UserPremiumFeatureName })
  featureName!: Models.User.PremiumFeatureName;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: false })
  activeUntil!: Date;

  @Index()
  @Column({ type: 'enum', enum: PremiumRenewal, nullable: true })
  autoRenew!: Common.PremiumRenewal | null;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;
}