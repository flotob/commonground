// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Unique {
  type OwnCommunityIds = {
    key: "OwnCommunityIds";
    ids: string[];
  }

  type OwnWallets = {
    key: "OwnWallets";
    wallets: Models.Wallet.Wallet[];
  }

  type OwnData = {
    key: "OwnData";
    data: Models.User.OwnData;
  }

  type TagFrequency = {
    key: "TagFrequency";
    byId: { [tag: string]: number };
    sortedArray: { tag: string, count: number }[];
    validUntil: number;
  }

  type UserListViewUpdateTimestamps = {
    key: "UserListViewUpdateTimestamps";
    data: { [id: string]: number };
  }

  type CommunityListViewUpdateTimestamps = {
    key: "CommunityListViewUpdateTimestamps";
    data: { [id: string]: number };
  }

  type CommunityDetailViewUpdateTimestamps = {
    key: "CommunityDetailViewUpdateTimestamps";
    data: { [id: string]: number };
  }

  type Object =
    OwnCommunityIds |
    TagFrequency |
    OwnWallets |
    OwnData |
    UserListViewUpdateTimestamps |
    CommunityListViewUpdateTimestamps |
    CommunityDetailViewUpdateTimestamps;
}