// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany
} from "typeorm";

/*
import { CommunityFeed } from "./communities-feeds";

@Entity({ name: 'feeds' })
export class Feed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToMany(() => CommunityFeed, (communityFeed) => communityFeed.feed)
  communityFeed!: CommunityFeed[];

  @OneToMany(() => FeedItem, (feedItem) => feedItem.feed)
  feedItems!: FeedItem[];

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
  deletedAt!: Date | null;
}

@Entity({ name: 'feeditems'})
export class FeedItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  feedId!: string;

  @ManyToOne(() => Feed)
  @JoinColumn({
    name: 'feedId',
    referencedColumnName: 'id'
  })
  feed!: Feed;

  @Column({ type: 'jsonb', nullable: true })
  content!: object | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
  deletedAt!: Date | null;
}
*/