// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  Column,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { Community } from "./communities";
import { Contract } from "./contracts";

// TODO:
// The relationship between communities and tokens is
// not enforced to have all the contract ids that the
// community roles use. So there could (theoretically)
// be a community role that uses a contract which is not
// added to the community as a token.

@Entity({ name: 'communities_tokens' })
export class CommunityToken {
  @PrimaryColumn({ type: 'uuid' })
  communityId!: string;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;

  @PrimaryColumn({ type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'contractId',
    referencedColumnName: 'id'
  })
  contract!: Contract;

  @Column({ type: 'integer', nullable: false, default: 0 })
  order!: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;
}