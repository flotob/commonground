// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare {
    namespace Models {
        namespace Server {
            // Todo: Traffic data?
            type CallServerStatus = {
                ongoingCalls: number;
                traffic: number;
            }

            type CallServer = {
                id: string;
                url: string;
                createdAt: string;
                updatedAt: string;
                deletedAt: string | null;
            }
        }
    }
}