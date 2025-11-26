// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        type AjaxResponse<T> = {
            error: string;
            status: "ERROR";
        } | (T extends void | undefined ? {
            status: "OK";
        } : {
            data: T;
            status: "OK";
        });
    }
}

export { };