// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace User {
    type Data = {
      type: 'cliUserData';
      data: (
        Partial<Models.User.Data> &
        Pick<Models.User.Data, "id">
      );
    };

    type OwnData = {
      type: 'cliUserOwnData';
      data: (
        Partial<Models.User.OwnData>
      );
    };

    type Wallet = {
      type: 'cliWalletEvent';
    } & ({
      action: 'new';
      data: Models.Wallet.Wallet;
    } | {
      action: 'update';
      data: (
        Pick<Models.Wallet.Wallet, "id"> &
        Partial<Models.Wallet.Wallet>
      );
    } | {
      action: 'delete';
      data: Pick<Models.Wallet.Wallet, "id">;
    });

    type Event = (
      Data |
      OwnData |
      Wallet
    );
  }
}