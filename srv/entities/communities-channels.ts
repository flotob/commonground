// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique
} from "typeorm";
import { ChannelPermission } from "../common/enums";
import { Area } from "./areas";
import { Channel } from "./channels";
import { Community } from "./communities";
import { Role } from "./roles";

@Entity({ name: 'communities_channels' })
@Unique(['communityId', 'url'])
export class CommunityChannel {
  @Index()
  @PrimaryColumn({ type: 'uuid' })
  communityId!: string;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;

  @PrimaryColumn({ type: 'uuid', unique: true })
  channelId!: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'channelId',
    referencedColumnName: 'id'
  })
  channel!: Channel;

  @Column({ type: 'uuid', nullable: true })
  areaId!: string | null;

  @ManyToOne(() => Area, (area) => area.communityChannels, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({
    name: 'areaId',
    referencedColumnName: 'id'
  })
  area!: Area | null;

  @OneToMany(() => CommunityChannelRolePermissions, (channelRolePermissions) => channelRolePermissions.communityChannel)
  rolePermissions!: CommunityChannelRolePermissions[];

  @Column({ type: 'varchar', length: 100, nullable: false })
  title!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  url!: string | null;

  @Column({ type: 'integer', nullable: false, default: 0 })
  order!: number;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  emoji!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  pinnedMessageIds!: string[];

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
  deletedAt!: Date | null;
}

@Entity({ name: 'communities_channels_roles_permissions' })
@Index(['communityId', 'channelId'])
export class CommunityChannelRolePermissions {
  @PrimaryColumn({ type: 'uuid' })
  communityId!: string;

  @PrimaryColumn({ type: 'uuid' })
  channelId!: string;

  @ManyToOne(() => CommunityChannel, { onDelete: 'CASCADE' })
  @JoinColumn([{
    name: 'communityId',
    referencedColumnName: 'communityId'
  }, {
    name: 'channelId',
    referencedColumnName: 'channelId'
  }])
  communityChannel!: CommunityChannel;

  @PrimaryColumn({ type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'roleId',
    referencedColumnName: 'id'
  })
  role!: Role;

  @Index()
  @Column({ type: 'enum', enum: ChannelPermission, array: true })
  permissions!: ChannelPermission[];
}