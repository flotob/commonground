// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Channel {
    type LastRead = {
      type: 'cliChannelLastRead';
      channelId: string;
      lastRead: string;
    }

    type Event = (
      LastRead
    );
  }
}