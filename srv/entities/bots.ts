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
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { User } from "./users";

@Entity({ name: 'bots' })
export class Bot {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true, where: '"deletedAt" IS NULL' })
    @Column({ type: 'varchar', length: 100, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    displayName!: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    avatarId!: string | null;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Index()
    @Column({ type: 'uuid', nullable: false })
    ownerUserId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'ownerUserId',
        referencedColumnName: 'id'
    })
    owner!: User;

    @Column({ type: 'varchar', length: 512, nullable: true })
    webhookUrl!: string | null;

    @Column({ type: 'text', nullable: true, select: false })
    webhookSecret!: string | null;

    @Column({ type: 'text', nullable: false, select: false })
    tokenHash!: string;

    @Column({ type: 'jsonb', nullable: false, default: '{}' })
    permissions!: Record<string, boolean>;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}

