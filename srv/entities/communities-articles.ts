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
  Unique,
  PrimaryGeneratedColumn
} from "typeorm";
import { ArticlePermission } from "../common/enums";
import { Article } from "./articles";
import { Community } from "./communities";
import { Role } from "./roles";

@Entity({ name: 'communities_articles' })
@Unique(['communityId', 'url'])
export class CommunityArticle {
    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    community!: Community;

    @PrimaryColumn({ type: 'uuid', unique: true })
    articleId!: string;

    @ManyToOne(() => Article, { onDelete: 'CASCADE' })
    @JoinColumn({
      name: 'articleId',
      referencedColumnName: 'id'
    })
    article!: Article;

    @OneToMany(() => CommunityArticleRolePermissions, (articleRolePermissions) => articleRolePermissions.communityArticle)
    rolePermissions!: CommunityArticleRolePermissions[];

    @Column({ type: 'varchar', length: 30, nullable: true })
    url!: string | null;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    published!: Date | null;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;

    @Column({ type: 'boolean', default: false })
    markAsNewsletter!: boolean;

    @Column({ type: 'timestamptz', precision: 3, nullable: true })
    sentAsNewsletter!: Date | null;
}

@Entity({ name: 'communities_articles_roles_permissions' })
export class CommunityArticleRolePermissions {
    @PrimaryColumn({ type: 'uuid' })
    communityId!: string;

    @PrimaryColumn({ type: 'uuid' })
    articleId!: string;

    @ManyToOne(() => CommunityArticle, { onDelete: 'CASCADE' })
    @JoinColumn([{
      name: 'communityId',
      referencedColumnName: 'communityId',
    }, {
      name: 'articleId',
      referencedColumnName: 'articleId'
    }])
    communityArticle!: CommunityArticle;

    @PrimaryColumn({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    role!: Role;

    @Index()
    @Column({ type: 'enum', enum: ArticlePermission, array: true })
    permissions!: ArticlePermission[];
}

