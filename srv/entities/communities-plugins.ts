// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from "typeorm";
import { Community } from "./communities";
import { Plugin } from "./plugins";

@Entity({ name: 'communities_plugins' })
export class CommunityPlugin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  communityId!: string;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;

  @Column({ type: 'uuid' })
  pluginId!: string;

  @ManyToOne(() => Plugin, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'pluginId',
    referencedColumnName: 'id'
  })
  plugin!: Plugin;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'jsonb', default: '{}' })
  config!: Models.Plugin.PluginConfig;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  createdAt!: Date;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  deletedAt!: Date | null;
}