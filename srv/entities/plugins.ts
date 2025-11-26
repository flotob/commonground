// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Entity, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Index } from "typeorm";
import { Community } from "./communities";

@Entity({ name: 'plugins' })
export class Plugin {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    ownerCommunityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'ownerCommunityId',
        referencedColumnName: 'id'
    })
    ownerCommunity!: Community;

    @Column({ type: 'varchar', length: 255, nullable: false })
    url!: string;

    @Index()
    @Column({ type: 'text', array: true, nullable: true })
    tags!: string[];

    @Column({ type: 'text', nullable: false })
    privateKey!: string;

    @Column({ type: 'text', nullable: false })
    publicKey!: string;

    @Column({ type: 'jsonb', nullable: true })
    permissions!: Models.Plugin.PluginPermissions | null;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    imageId!: string | null;

    @Column({ type: 'boolean', default: false })
    clonable!: boolean;

    @Column({ type: 'boolean', default: false })
    appstoreEnabled!: boolean;

    @Column({ type: 'boolean', default: false })
    warnAbusive!: boolean;

    @Column({ type: 'boolean', default: false })
    requiresIsolationMode!: boolean;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}
