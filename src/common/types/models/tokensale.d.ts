// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
    namespace TokenSale {
        type SaleData = {
            id: string;
            name: string;
            saleContractChain: Models.Contract.ChainIdentifier;
            saleContractAddress: Common.Address;
            saleContractType: Models.Contract.SaleContractType;
            targetTokenChain: Models.Contract.ChainIdentifier;
            targetTokenAddress: Common.Address;
            targetTokenDecimals: number;
            totalInvested: string;
            startDate: string;
            endDate: string;
        };

        type UserSaleData = {
            tokenSaleId: string;
            referredByUserId: string | null;
            totalInvested: string;
            totalTokensBought: string;
            referralBonus: string;
            referredUsersDirectCount: number;
            referredUsersIndirectCount: number;
            targetAddress: Common.Address | null;
            rewardProgram: {
                messagesWrittenReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                callsJoinedReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                luksoReward?: {
                    totalUsersRewarded: number;
                    reward: string;
                };
                fuelReward?: {
                    totalUsersRewarded: number;
                    reward: string;
                };
                sparkBoughtReward?: {
                    totalUsersRewarded: number;
                    reward: string;
                };
                recentLoginReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                communitiesJoinedReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                articlesWrittenReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                registrationReward?: {
                    totalUsersRewarded: number;
                    reward: string;
                };
                oldAccountWithMessageReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                oldAccountWithoutMessageReward?: {
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                };
                communityAirdropRewards?: {
                    communityId: string;
                    totalUsersRewarded: number;
                    yourPosition: number;
                    reward: string;
                }[];
                giveawayWinnersReward?: {
                    reward: string;
                };
                totalReward?: string;
            };
            rewardClaimedTimestamp: string | null;
        };
    }
}