// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    CreateDateColumn,
    Column,
    PrimaryGeneratedColumn,
    Index,
  } from "typeorm";
  
  @Entity({ name: 'point_transactions' })
  export class PointTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    userId!: string | null;
  
    @Index()
    @Column({ type: 'uuid', nullable: true })
    communityId!: string | null;
  
    @Column({ type: 'integer', nullable: false })
    amount!: number;

    @Column({ type: 'jsonb', nullable: false })
    data!: Models.Premium.TransactionData;
  
    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;
  }