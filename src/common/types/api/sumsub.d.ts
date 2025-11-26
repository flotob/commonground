// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Sumsub {
            type KycType = "liveness-only" | "full-kyc-level" | "cg-tokensale";
            
            namespace getAccessToken {
                type Request = {
                    type: KycType
                };
                type Response = {
                    accessToken: string;
                };
            }
            namespace applicantReviewed {
                type Request = undefined;
                type Response = {
                    status: "ok";
                };
            }
        }
    }
}

export { };