// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  Column,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: 'chaindata' })
export class Area {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: Models.Contract.ChainIdentifier;

  @Column({ type: 'json' })
  data!: any;
}
