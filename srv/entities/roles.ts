// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  PrimaryGeneratedColumn,
  Index,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
  OneToMany
} from "typeorm";
import { Community } from "./communities";
import { User } from "./users";
import { CommunityPermission, RoleType } from "../common/enums";
import { Contract } from "./contracts";
import { CallPermissions } from "./call";
import { CommunityEventPermissions } from "./communities-events";

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  communityId!: string;

  @Index()
  @ManyToOne(() => Community, (community) => community.roles, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'communityId',
    referencedColumnName: 'id'
  })
  community!: Community;

  @OneToMany(() => UserRoleClaim, (userRoleClaim) => userRoleClaim.role)
  @JoinTable()
  userRoleClaims!: UserRoleClaim[];

  @OneToMany(() => CallPermissions, (callPermissions) => callPermissions.role)
  callPermissions!: CallPermissions[];

  @OneToMany(() => CommunityEventPermissions, (communityEventPermissions) => communityEventPermissions.role)
  eventPermissions!: CommunityEventPermissions[];

  // UNIQUE(LOWER(title), communityId)
  @Index('role_lowercase_title_per_community_unique', { synchronize: false })
  @Column({ type: 'varchar', length: 64, nullable: false })
  title!: string;

  @Column({ type: 'enum', enum: RoleType, nullable: false })
  type!: RoleType;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  imageId!: string | null;

  @Column({ type: 'varchar', length: 140, nullable: true, default: null })
  description!: string | null;

  // @Index('idx_role_airdrop_end_date', { synchronize: false })
  @Column({ type: 'jsonb', nullable: true })
  airdropConfig!: Models.Community.RoleAirdropConfig | null;

  @ManyToMany(() => Contract, (contract) => contract.roles)
  @JoinTable()
  contracts!: Contract[];

  @Column({ type: 'jsonb', nullable: true })
  assignmentRules!: Models.Community.AssignmentRules | null;

  @Column({ type: 'enum', enum: CommunityPermission, array: true })
  permissions!: CommunityPermission[];

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
  deletedAt!: Date | null;
}

@Entity({ name: 'roles_users_users' })
export class UserRoleClaim {
    @PrimaryColumn({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
      name: 'userId',
      referencedColumnName: 'id',
    })
    user!: User;

    @PrimaryColumn({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({
      name: 'roleId',
      referencedColumnName: 'id',
    })
    role!: Role;

    @Index()
    @Column({ type: 'boolean', default: false })
    claimed!: boolean;

    @Index()
    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;
}