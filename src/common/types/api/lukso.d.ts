// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Lukso {
            
            namespace PrepareLuksoAction {
                type Request = {
                    address: string;
                    signature: string;
                    message: string;
                };
                type Response = {
                    username: string;
                    profileImageUrl: string | undefined;
                    description: string | undefined;
                    universalProfileValid: boolean;
                    universalProfileExists: boolean;
                    readyForLogin: boolean;
                    readyForCreation: boolean;
                };
            }
        }
    }
}

export { };