// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, DeleteDateColumn, Unique } from 'typeorm';
import { User } from './users';
import { ReportType } from '../common/enums';

@Entity({ name: 'reports' })
@Unique(['reporterId', 'targetId', 'type'])
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    reporterId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'reporterId',
        referencedColumnName: 'id'
    })
    reporter!: User;

    @Column({ type: 'text' })
    reason!: string;

    @Column({ type: 'text', nullable: true })
    message!: string | null;

    @Index()
    @Column({ type: 'enum', enum: ReportType, nullable: false })
    type!: ReportType;

    @Index()
    @Column({ type: 'uuid' })
    targetId!: string;

    @Index()
    @Column({ type: 'boolean', default: false })
    resolved!: boolean;

    @Column({ type: 'text', nullable: true })
    remark!: string | null;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}