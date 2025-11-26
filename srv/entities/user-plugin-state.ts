// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./users";
import { Plugin } from "./plugins";

@Entity({ name: 'user_plugin_state' })
export class UserPluginState {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @PrimaryColumn({ type: 'uuid' })
  pluginId!: string;

  @ManyToOne(() => Plugin, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'pluginId',
    referencedColumnName: 'id'
  })
  plugin!: Plugin;

  @Column({ type: 'jsonb', nullable: true })
  acceptedPermissions!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;
}
