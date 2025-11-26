// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Twitter {
            namespace startLogin {
                type Request = undefined;
                type Response = {
                    url: string;
                };
            }

            namespace finishLogin {
                type Request = undefined;
                type Response = {
                    username: string;
                    profileImageUrl: string | undefined;
                    description: string | undefined;
                    homepage: string | undefined;
                }
            }

            namespace shareJoined {
                type Request = undefined;
                type Response = {
                    ok: boolean;
                }
            }
        }
    }
}

export { };