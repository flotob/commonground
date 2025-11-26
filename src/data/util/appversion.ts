// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

const appVersionRegex = /^(\d+)\.(\d+)\.(\d+)$/;

export function isAppVersionNewer({ oldAppVersion, newAppVersion }: { oldAppVersion: string, newAppVersion: string }) {
    const oldMatch = oldAppVersion.match(appVersionRegex);
    const newMatch = newAppVersion.match(appVersionRegex);
    if (!oldMatch || !newMatch) {
        throw new Error("Invalid app versions");
    }
    const old1 = parseInt(oldMatch[1]);
    const old2 = parseInt(oldMatch[2]);
    const old3 = parseInt(oldMatch[3]);
    const new1 = parseInt(newMatch[1]);
    const new2 = parseInt(newMatch[2]);
    const new3 = parseInt(newMatch[3]);

    return (
        new1 > old1 || (
            new1 === old1 && (
                new2 > old2 || (
                    new2 === old2 && new3 > old3
                )
            )
        )
    );
}