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
import { Community } from "./communities";
// import { Feed } from "./feeds";
import { Role } from "./roles";

/*
@Entity({ name: 'communities_feeds' })
@Unique(['communityId', 'url'])
export class CommunityFeed {
    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @PrimaryColumn({ type: 'uuid', unique: true })
    feedId!: string;

    @ManyToOne(() => Feed, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'feedId',
        referencedColumnName: 'id'
    })
    feed!: Feed;

    @OneToMany(() => CommunityFeedRolePermissions, (feedRolePermissions) => feedRolePermissions.communityFeed)
    rolePermissions!: CommunityFeedRolePermissions[];

    @Column({ type: 'varchar', length: 30 })
    url!: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    title!: string;;

    @Column({ type: 'varchar', length: 256, nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 16, nullable: true })
    emoji!: string | null;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}

@Entity({ name: 'communities_feeds_roles_permissions' })
export class CommunityFeedRolePermissions {
    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @PrimaryColumn({ type: 'uuid' })
    feedId!: string;

    @ManyToOne(() => CommunityFeed, { onDelete: 'CASCADE' })
    @JoinColumn([{
        name: 'communityId',
        referencedColumnName: 'communityId'
    }, {
        name: 'feedId',
        referencedColumnName: 'feedId'
    }])
    communityFeed!: CommunityFeed;

    @PrimaryColumn({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    role!: Role;

    @Index()
    @Column({ type: 'enum', enum: PermissionType, array: true })
    permissions!: PermissionType[];
}
*/