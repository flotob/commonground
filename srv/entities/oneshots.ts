// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    PrimaryColumn,
    CreateDateColumn,
} from "typeorm";

@Entity({ name: 'oneshot_jobs' })
export class OneshotJob {
    @PrimaryColumn({ type: 'varchar', length: 256 })
    id!: string;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;
}
