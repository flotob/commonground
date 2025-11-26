// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

const domainName = "Common Ground";
const verifyingContract = "0xDdeb1a370A88c5bcB6ec10191C03F8eC1d2Bd6fA" as Common.Address;

export function getDomain(chainId: number) {
  return {
    name: domainName,
    version: "1",
    chainId,
    verifyingContract,
  };
}

export function getTypes() {
  return {
    Wallet: [
      { name: "address", type: "string" },
      { name: "chainId", type: "uint32" },
      { name: "secret", type: "string" },
    ],
  };
}