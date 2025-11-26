// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

/**
 * Clones the given data.
 */
export function clone<T>(data: T, defaultValue?: T): T {
    if (typeof data === 'undefined') {
        return defaultValue!;
    }

    return JSON.parse(JSON.stringify(data));
}
