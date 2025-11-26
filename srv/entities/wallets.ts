// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
    Entity,
    ManyToOne,
    JoinColumn,
    Column,
    PrimaryGeneratedColumn,
    Index,
    DeleteDateColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    PrimaryColumn,
    OneToMany
} from "typeorm";
import { User } from "./users";
import {
    WalletType,
    WalletVisibility
} from "../common/enums";
import { Contract } from "./contracts";

@Entity({ name: 'wallets' })
@Unique(['type', 'walletIdentifier'])
@Unique(['type', 'walletIdentifier', 'chain'])
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    userId!: string;

    @Index()
    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({
        name: 'userId',
        referencedColumnName: 'id'
    })
    user!: User;

    @OneToMany(() => WalletBalance, (walletBalance) => walletBalance.wallet)
    balances!: WalletBalance[];

    @Column({ type: 'enum', enum: WalletType, nullable: false, default: WalletType.EVM })
    type!: WalletType;

    @Column({ type: 'text', nullable: false })
    walletIdentifier!: Models.Wallet.WalletIdentifier;

    @Column({ type: 'boolean', nullable: false, default: false })
    loginEnabled!: boolean;

    @Column({ type: 'enum', enum: WalletVisibility, nullable: false, default: WalletVisibility.PRIVATE })
    visibility!: WalletVisibility;

    @Column({ type: 'jsonb', nullable: false })
    signatureData!: Models.Wallet.Wallet["signatureData"];

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: true })
    chain!: Models.Contract.ChainIdentifier;

    @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamptz', precision: 3, select: false })
    deletedAt!: Date | null;
}

@Entity({ name: 'wallet_balances' })
export class WalletBalance {
    @PrimaryColumn({ type: 'uuid' })
    walletId!: string;

    @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'walletId',
        referencedColumnName: 'id'
    })
    wallet!: Wallet;

    @PrimaryColumn({ type: 'uuid' })
    contractId!: string;

    @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'contractId',
        referencedColumnName: 'id'
    })
    contract!: Contract;

    @Column({ type: 'jsonb' })
    balance!: Models.Contract.WalletBalance["balance"];

    @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
    updatedAt!: Date;
}
