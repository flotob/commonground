// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";
import { Call } from "./call";

@Entity({ name: 'callservers' })
export class CallServer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'jsonb' })
  status!: Models.Server.CallServerStatus;

  @OneToMany(() => Call, (call) => call.callServer)
  calls!: Call[];

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  url!: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3 })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', precision: 3 })
  deletedAt!: Date | null;
}