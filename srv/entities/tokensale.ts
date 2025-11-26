// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import {
  Entity,
  CreateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  PrimaryColumn,
  OneToMany,
} from "typeorm";
import { User } from "./users";

@Entity({ name: 'tokensale_registrations' })
export class TokenSaleRegistration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.tokenSaleRegistrations, { onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User | null;

  @Index("idx_tokensale_email_lower_unique", { synchronize: false })
  @Column({ type: 'varchar', nullable: false })
  email!: string;

  @Column({ type: 'uuid', nullable: true })
  referredBy!: string | null;

  @ManyToOne(() => User, (user) => user.tokenSaleReferrals, { onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'referredBy',
    referencedColumnName: 'id'
  })
  referredByUser!: User | null;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  oneDayEmailSentAt!: string | null;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  startsNowEmailSentAt!: string | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;
}

@Entity({ name: 'tokensales' })
export class TokenSale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  saleContractChain!: Models.Contract.ChainIdentifier;

  @Column({ type: 'varchar', length: 50, nullable: false })
  saleContractAddress!: Common.Address;

  @Column({ type: 'varchar', length: 50, nullable: false })
  saleContractType!: Models.Contract.SaleContractType;

  @Column({ type: 'varchar', length: 64, nullable: false })
  targetTokenChain!: Models.Contract.ChainIdentifier;

  @Column({ type: 'varchar', length: 50, nullable: false })
  targetTokenAddress!: Common.Address;

  @Column({ type: 'integer', nullable: false })
  targetTokenDecimals!: number;

  @Column({ type: 'bigint', nullable: false, default: 0 })
  recentUpdateBlockNumber!: string;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  oneDayEmailSentAt!: string | null;

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  startsNowEmailSentAt!: string | null;

  @Column({ type: 'timestamptz', precision: 3, select: false, nullable: false, default: () => 'now()' })
  startDate!: Date;

  @Column({ type: 'varchar', length: 255, nullable: false, default: '0' })
  totalInvested!: string;

  @Column({ type: 'timestamptz', precision: 3, select: false, nullable: false })
  endDate!: Date;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;
}

@Entity({ name: 'tokensale_userdata' })
export class TokenSaleUserData {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @PrimaryColumn({ type: 'uuid' })
  tokenSaleId!: string;

  @ManyToOne(() => TokenSale, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'tokenSaleId',
    referencedColumnName: 'id'
  })
  tokenSale!: TokenSale;

  @Column({ type: 'uuid', nullable: true })
  referredByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'referredByUserId',
    referencedColumnName: 'id'
  })
  referredByUser!: User | null;

  @OneToMany(() => TokenSaleInvestment, (event) => event.tokenSaleUserData)
  tokenSaleEvents!: TokenSaleInvestment[];

  @Column({ type: 'decimal', precision: 80, scale: 0, nullable: false, default: '0' })
  totalInvested!: string;

  @Column({ type: 'decimal', precision: 80, scale: 0, nullable: false, default: '0' })
  totalTokensBought!: string;

  @Column({ type: 'decimal', precision: 80, scale: 0, nullable: false, default: '0' })
  referralBonus!: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  referredUsersDirectCount!: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  referredUsersIndirectCount!: number;

  @Column({ type: 'jsonb', nullable: false, default: () => 'jsonb_build_object()' })
  rewardProgram!: Models.TokenSale.UserSaleData['rewardProgram'];

  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  rewardClaimedTimestamp!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rewardClaimedSecurityData!: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetAddress!: Common.Address | null;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  oneDayEmailSentAt!: string | null;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  startsNowEmailSentAt!: string | null;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  oneDayNotificationSentAt!: string | null;

  @Index()
  @Column({ type: 'timestamptz', precision: 3, nullable: true })
  startsNowNotificationSentAt!: string | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  updatedAt!: Date;
}

@Entity({ name: 'tokensale_investments' })
export class TokenSaleInvestment {
  @PrimaryColumn({ type: 'bigint', nullable: false })
  investmentId!: number;

  @PrimaryColumn({ type: 'uuid' })
  tokenSaleId!: string;

  @ManyToOne(() => TokenSale, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'tokenSaleId',
    referencedColumnName: 'id'
  })
  tokenSale!: TokenSale;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    referencedColumnName: 'id'
  })
  user!: User;

  @ManyToOne(() => TokenSaleUserData, (tokenSaleUserData) => tokenSaleUserData.tokenSaleEvents)
  @JoinColumn([{
    name: 'tokenSaleId',
    referencedColumnName: 'tokenSaleId'
  }, {
    name: 'userId',
    referencedColumnName: 'userId'
  }])
  tokenSaleUserData!: TokenSaleUserData;
  
  @Column({ type: 'jsonb', nullable: false })
  event!: Models.Contract.SaleInvestmentEventJson;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, select: false })
  createdAt!: Date;
}