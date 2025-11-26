// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
    namespace Passkey {
        type Data = {
            credentialID: string;
            credentialBackedUp: boolean;
            credentialDeviceType: string;
            createdAt: string;
            updatedAt: string;
        };
    }
}