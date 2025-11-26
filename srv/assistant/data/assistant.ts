// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import pool from "../../util/postgres";

export const getModelAvailability = async () => {
    const result = await pool.query<{
        modelName: Assistant.ModelName;
        title: string;
        domain: string;
        isAvailable: boolean;
        extraData: Record<string, any> | null;
    }>(`
        SELECT * FROM assistant_availability
        ORDER BY "order" ASC
    `);
    return result.rows;
};
