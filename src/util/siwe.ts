// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export default function getSiweMessage({
    address,
    chainId,
    secret,
}: {
    address: Common.Address;
    chainId: number;
    secret: string;
}) {
    const message = [
        `${window.location.host} wants you to sign in with your Ethereum account:\n${address}\n`,
        `Sign this to log into Common Ground.\n`,
        `URI: ${window.location.origin}`,
        `Version: 1`,
        `Chain ID: ${chainId}`,
        `Nonce: ${secret}`,
        `Issued At: ${new Date().toISOString()}`,
    ].join('\n');
    return message;
}