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
  DeleteDateColumn,
  UpdateDateColumn,
  Unique,
  Index
} from "typeorm";
import { Article } from "./articles";
import { User } from "./users";

@Entity({ name: 'users_articles' })
@Unique(['userId', 'url'])
export class UserArticle {
    @Index()
    @PrimaryColumn({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @PrimaryColumn({ type: 'uuid', unique: true })
    articleId!: string;

    @ManyToOne(() => Article, { onDelete: 'CASCADE' })
    @JoinColumn({
      name: 'articleId',
      referencedColumnName: 'id'
    })
    article!: Article;

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
}