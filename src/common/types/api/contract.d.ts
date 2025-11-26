// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Contract {
            namespace getContractData {
                type Request = {
                    chain: Models.Contract.ChainIdentifier;
                    address: Common.Address;
                }
                type Response = Models.Contract.Data;
            }

            namespace getContractDataByIds {
                type Request = {
                    contractIds: string[];
                }
                type Response = Models.Contract.Data[];
            }
        }
    }
}

export { };