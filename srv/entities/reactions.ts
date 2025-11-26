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
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { User } from "./users";

@Entity({ name: 'reactions' })
export class Reaction {
    @PrimaryColumn('uuid')
    userId!: string;

    @Index()
    @PrimaryColumn('uuid')
    itemId!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @Column({ type: 'varchar', length: 3, nullable: false })
    reaction!: string;

    @Index()
    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @Index()
    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @Index()
    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}
