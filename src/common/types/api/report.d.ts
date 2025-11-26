// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Report {
            namespace createReport {
                type Request = Pick<Models.Report.Report, 'reason' | 'message' | 'type' | 'targetId'>;
                type Response = undefined;
            }

            namespace getReportReasons {
                type Request = Pick<Models.Report.Report, 'type' | 'targetId'>;
                type Response = string[];
            }
        }
    }
}

export { };