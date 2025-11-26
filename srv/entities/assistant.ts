// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";
import { User } from "./users";
import { Community } from "./communities";

@Entity({ name: 'assistant_dialogs' })
export class AssistantDialog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'jsonb' })
  request!: Assistant.Request;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  communityId!: string | null;

  @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  model!: Assistant.ModelName;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3 })
  updatedAt!: Date;
}

@Entity({ name: 'assistant_availability' })
export class AssistantModel {
  @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
  modelName!: Assistant.ModelName;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isAvailable!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  domain!: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  order!: number;

  @Column({ type: 'jsonb', nullable: true })
  extraData!: Record<string, any> | null;
}