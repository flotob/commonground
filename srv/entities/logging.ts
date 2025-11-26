// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn
} from "typeorm";

@Entity({ name: 'logging' })
export class LogEntry {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 30, nullable: false })
    service!: string;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @Column({ type: 'jsonb', nullable: false })
    data!: any;
}
