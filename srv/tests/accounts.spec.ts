// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { after } from "lodash";
import { Account } from "../entities/accounts";
import { TestHelper } from "./testhelper"

beforeAll(async () => {
    const datasource = await TestHelper.instance.setupTestDB();
    await datasource.runMigrations()
    const accountRepository = await datasource.createEntityManager();
});

afterAll(async () => {
    //await TestHelper.instance.teardownTestDB();
});

describe('Account tests', () => {
    afterEach(async () => {
        
    });

    test('should get one account by id', async () => {
        const createdAccount = new Account();
        const savedAccount = await createdAccount.save();
        //const account = await Account.createOrGetAccount('testAccountId');
        const account = await Account.getAccount(savedAccount.id);
        expect(account?.id).toBe(savedAccount.id);
        expect(account?.recoveryStorage).toBeNull();
    })

    test('should create or get account', async () => {
        const createdAccount = new Account();
        const savedAccount = await createdAccount.save();
        //const account = await Account.createOrGetAccount('testAccountId');
        const account = await Account.getAccount(savedAccount.id);
        expect(account?.id).toBe(savedAccount.id);
        expect(account?.recoveryStorage).toBeNull();
    })
});