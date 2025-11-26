// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  PrimaryColumn,
  OneToMany,
  OneToOne
} from "typeorm";
import { Community } from "./communities";
import { User } from "./users";
import { Role } from "./roles";
import { CommunityEventPermission, CommunityEventType } from "../common/enums";
import { Call } from "./call";

@Entity({ name: 'communities_events' })
@Unique(['communityId', 'url'])
export class CommunityEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  communityId!: string;

  @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;
  
  @Column({ type: 'varchar', length: 30, nullable: true })
  url!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  eventCreator!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'eventCreator',
    referencedColumnName: 'id'
  })
  creator!: User;

  @Column({ type: 'uuid', nullable: true })
  callId!: string | null;

  @OneToOne(() => Call, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'callId',
    referencedColumnName: 'id'
  })
  call!: Call;

  @Column({ type: 'enum', enum: CommunityEventType, nullable: false })
  type!: CommunityEventType;
  
  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  imageId!: string | null;

  @OneToMany(() => CommunityEventPermissions, (communityEventPermissions) => communityEventPermissions.communityEvent)
  communityEventPermissions!: CommunityEventPermissions[];

  @Column({ type: 'varchar', length: 100, nullable: false })
  title!: string;

  @Column({ type: 'jsonb', nullable: false }) // plain text + version
  description!: Models.BaseArticle.ContentV2;

  @Column({ type: 'varchar', length: 250, nullable: true })
  externalUrl!: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  location!: string | null;

  @Column({ type: 'timestamptz', precision: 3 })
  scheduleDate!: Date;
  
  @Column({ type: 'integer', nullable: true, default: null })
  duration!: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  eventNotified!: boolean;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3 })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
  deletedAt!: Date | null;
}

@Entity({ name: 'communities_events_participants' })
export class CommunityEventParticipant {
  @Index()
  @PrimaryColumn({ type: 'uuid' })
  eventId!: string;

  @ManyToOne(() => CommunityEvent, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'eventId',
    referencedColumnName: 'id'
  })
  event!: CommunityEvent;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt!: Date;
}

@Entity({ name: 'communities_events_permissions' })
export class CommunityEventPermissions {
  @Index()
  @PrimaryColumn({ type: 'uuid' })
  communityEventId!: string;

  @ManyToOne(() => CommunityEvent, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'communityEventId',
    referencedColumnName: 'id'
  })
  communityEvent!: CommunityEvent;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'roleId',
    referencedColumnName: 'id'
  })
  role!: Role;

  @Column({ type: 'enum', enum: CommunityEventPermission, array: true })
  permissions!: CommunityEventPermission[];
}