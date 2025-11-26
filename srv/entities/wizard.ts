// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    CreateDateColumn,
    Index,
    OneToMany,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Community } from "./communities";
import { Role } from "./roles";
import { User } from "./users";

@Entity({ name: 'wizards' })
export class Wizard {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: false })
    communityId!: string;

    @ManyToOne(() => Community, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'communityId',
        referencedColumnName: 'id'
    })
    community!: Community;

    @Column({ type: 'jsonb', nullable: false, default: {} })
    data!: Models.Wizard.Wizard;

    @OneToMany(() => WizardRolePermission, (perm) => perm.wizard)
    rolePermissions!: WizardRolePermission[];

    @OneToMany(() => WizardUserData, (data) => data.wizard)
    userData!: WizardUserData[];
    
    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @Index()
    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}

@Entity({ name: 'wizard_role_permission' })
export class WizardRolePermission {
    @PrimaryColumn({ type: 'uuid' })
    wizardId!: string;

    @ManyToOne(() => Wizard, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'wizardId',
        referencedColumnName: 'id'
    })
    wizard!: Wizard;

    @PrimaryColumn({ type: 'uuid' })
    roleId!: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'roleId',
        referencedColumnName: 'id'
    })
    role!: Role;
}

@Entity({ name: 'wizard_claimable_codes' })
export class WizardClaimableCode {
    @PrimaryColumn({ type: 'uuid', nullable: false })
    wizardId!: string;

    @ManyToOne(() => Wizard, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'wizardId',
        referencedColumnName: 'id'
    })
    wizard!: Wizard;

    @PrimaryColumn({ type: 'varchar', length: 32, nullable: false })
    code!: string;

    @Column({ type: 'uuid', nullable: true })
    claimedBy!: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'claimedBy',
        referencedColumnName: 'id'
    })
    claimedByUser!: User | null;

    @Column({ type: 'uuid', nullable: true })
    createdBy!: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'createdBy',
        referencedColumnName: 'id'
    })
    createdByUser!: User | null;
}

@Entity({ name: 'wizard_user_data' })
export class WizardUserData {
    @PrimaryColumn({ type: 'uuid', nullable: false })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @PrimaryColumn({ type: 'uuid', nullable: false })
    wizardId!: string;

    @ManyToOne(() => Wizard, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'wizardId',
        referencedColumnName: 'id'
    })
    wizard!: Wizard;

    @Column({ type: 'jsonb', nullable: false })
    data!: Models.Wizard.WizardUserData;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;
}

@Entity({ name: 'wizard_investment_data' })
export class WizardInvestmentData {
    @PrimaryColumn({ type: 'varchar', length: 32, nullable: false })
    target!: Models.Wizard.ValidInvestmentTarget;

    @PrimaryColumn({ type: 'varchar', length: 128, nullable: false })
    txHash!: string;

    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @Column({ type: 'uuid', nullable: false })
    wizardId!: string;

    @ManyToOne(() => Wizard, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'wizardId',
        referencedColumnName: 'id'
    })
    wizard!: Wizard;

    @Column({ type: 'varchar', length: 32, nullable: false })
    chain!: Models.Contract.ChainIdentifier;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    fromAddress!: Common.Address;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    toAddress!: Common.Address;

    @Column({ type: 'varchar', length: 128, nullable: false })
    amount!: string;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;
}