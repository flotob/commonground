// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./users";

@Entity({ name: 'files' })
export class UploadFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  creatorId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
      name: 'creatorId',
      referencedColumnName: 'id'
  })
  creator!: User | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
  objectId!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: Common.ImageMetadata | null;

  @Column({ type: 'jsonb', nullable: true })
  uploadOptions!: API.Files.UploadOptions | null;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, default: () => 'now()' })
  accessedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;
}
