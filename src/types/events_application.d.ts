// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Application {
    type ConnectionLost = {
      type: 'cliConnectionLost';
      lastKnownConnectionTime: number;
    }

    type ConnectionEstablished = {
      type: 'cliConnectionEstablished';
    }

    type ConnectionRestored = {
      type: 'cliConnectionRestored';
    }

    type Event = { sessionId?: never } & (
      ConnectionLost |
      ConnectionEstablished |
      ConnectionRestored
    );
  }
}