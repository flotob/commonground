// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Calls {
    type Call = {
      type: 'cliCallEvent';
    } & ({
      action: 'new';
      data: Models.Calls.Call;
    } | {
      action: 'update';
      data: (
        Pick<Models.Calls.Call, "id" | "communityId"> &
        Partial<Models.Calls.Call>
      );
    } | {
      action: 'delete';
      data: Pick<Models.Calls.Call, "id" | "communityId">;
    });

    type Event = (
      Call
    );
  }
}