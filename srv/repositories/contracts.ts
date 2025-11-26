// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import errors from "../common/errors";
import pool from "../util/postgres";
import onchainHelper from "./onchain";
import config from "../common/config";

const activeChains = new Set(config.ACTIVE_CHAINS);

class ContractHelper {
  public async getAll(): Promise<Models.Contract.Data[]> {
    const result = await pool.query(`
      SELECT "id", "chain", "address", "data"
      FROM contracts
    `);
    return result.rows;
  }

  public async createContract(
    chain: Models.Contract.ChainIdentifier,
    address: Common.Address,
    data: Models.Contract.OnchainData
  ): Promise<{ id: string }> {
    const query = `
      INSERT into contracts (chain, address, data)
      VALUES ($1, $2, $3::jsonb)
      RETURNING id;
    `;
    const values = [
      chain,
      address,
      JSON.stringify(data),
    ];
    const result = await pool.query(query, values);
    if (result.rows.length === 1) {
      return result.rows[0];
    }
    throw new Error(errors.server.UNKNOWN);
  }

  public async getContractDataByParamsNoFetch(
    chain: Models.Contract.ChainIdentifier,
    address: Common.Address,
  ): Promise<Models.Contract.Data | null> {
    const query = `
      SELECT id, chain, address, data
      FROM contracts
      WHERE chain = $1 AND address = $2;
    `;
    const result = await pool.query(query, [
      chain,
      address.toLowerCase(),
    ]);
    if (result.rowCount === 1) {
      return result.rows[0] as {
        id: string,
        address: Common.Address,
        chain: Models.Contract.ChainIdentifier,
        data: Models.Contract.OnchainData,
      };
    }
    return null;
  }

  public async getContractDataByParams(
    chain: Models.Contract.ChainIdentifier,
    address: Common.Address,
  ): Promise<Models.Contract.Data | null> {
    const dataFromDb = await this.getContractDataByParamsNoFetch(chain, address);
    if (dataFromDb) {
      return dataFromDb;
    } else if (activeChains.has(chain)) {
      try {
        const data = await onchainHelper.getContractData(chain, address);
        const idRow = await this.createContract(chain, address, data.data);
        return {
          ...data,
          id: idRow.id,
        }; 
      } catch (e) {
        console.log("Error receiving contract data from onchain service: ", e);
      }
    } else {
      console.log("Chain is inactive, skipping contract data retrieval");
    }
    return null;
  }

  public async getContractDataByIds(ids: string[]): Promise<Models.Contract.Data[]> {
    const query = `
      SELECT id, chain, address, data
      FROM contracts
      WHERE id = ANY ($1);
    `;
    const result = await pool.query(query, [ids]);
    return result.rows;
  }
}

const contractHelper = new ContractHelper();
export default contractHelper;