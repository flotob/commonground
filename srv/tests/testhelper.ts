// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { DataSource } from "typeorm"
import { createDatabase, dropDatabase } from 'typeorm-extension';
import { connectionOptions } from "./datasource";

export class TestHelper {

    private static _instance: TestHelper;

    private constructor() {}

    public static get instance(): TestHelper {
        if(!this._instance) this._instance = new TestHelper();

        return this._instance;
    }

    private datasource: DataSource;

    async setupTestDB(): Promise<DataSource> {
        await createDatabase({ options: connectionOptions });

        this.datasource = new DataSource(connectionOptions);
        await this.datasource.initialize();
        return this.datasource;
    }

    async teardownTestDB(): Promise<void> {
        if (this.datasource) {
            await this.datasource.destroy();
        }

        await dropDatabase({ options: connectionOptions });
    }
}