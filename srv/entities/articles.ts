// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    ManyToOne,
    JoinColumn,
    DeleteDateColumn,
    UpdateDateColumn,
    CreateDateColumn,
    OneToMany,
    OneToOne
} from "typeorm";
import { CommunityArticle } from "./communities-articles";
import { User } from "./users";
import { UserArticle } from "./users-articles";
import { Channel } from "./channels";

@Entity({ name: 'articles' })
export class Article {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    creatorId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'creatorId',
        referencedColumnName: 'id'
    })
    creator!: User;

    @Column({ type: 'varchar', length: 64, nullable: true })
    headerImageId!: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    thumbnailImageId!: string | null;

    @Column({ type: 'varchar', length: 256, nullable: false })
    title!: string;

    @Column({ type: 'jsonb', nullable: false }) // plain text + version
    content!: Models.BaseArticle.Content;

    @Column({ type: 'varchar', length: 150, nullable: true })
    previewText!: string | null;

    @Index()
    @Column({ type: 'text', array: true, nullable: true })
    tags!: string[];

    @OneToMany(() => CommunityArticle, (communityArticle) => communityArticle.article)
    communityArticles!: CommunityArticle[];

    @OneToMany(() => UserArticle, (userArticles) => userArticles.article)
    userArticles!: UserArticle[];

    @OneToOne(() => Channel, channel => channel.article)
    @JoinColumn({
        name: 'channelId',
        referencedColumnName: 'id'
    })
    channel!: Channel;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}
