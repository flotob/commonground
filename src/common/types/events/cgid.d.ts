// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
    namespace CgId {
        type SignResponse = {
            type: 'cliCgIdSignResponse';
            frontendRequestId: string;
            data: {
                type: 'registration';
                success: boolean;
                error?: string;
            } | {
                type: 'authentication';
                success: boolean;
                error?: string;
            };
        };

        type Event = (
            SignResponse
        );
    }
  }