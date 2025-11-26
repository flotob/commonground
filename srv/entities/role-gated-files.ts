// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    Column,
    CreateDateColumn,
    PrimaryColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Role } from "./roles";

@Entity({ name: 'role_gated_files' })
export class RoleGatedFile {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    filename!: string;

    @Column({ type: 'varchar', length: 30, nullable: false })
    type!: 'download' | 'video';

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @Column({ type: 'uuid', nullable: false })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({
        name: 'roleId',
        referencedColumnName: 'id'
    })
    role!: Role;
}
