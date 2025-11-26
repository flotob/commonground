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
    JoinColumn,
    DeleteDateColumn,
    UpdateDateColumn
} from "typeorm";
import { User } from "./users";

@Entity({ name: 'passkeys' })
export class Passkey {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User | null;

    @Index('IDX_passkeys_data_credentialID_webAuthnUserID', { synchronize: false })
    @Column({ type: 'jsonb', nullable: false })
    data!: Models.Passkey.FullData;

    @Column({ type: 'bigint', nullable: false, default: 0 })
    counter!: number;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}
