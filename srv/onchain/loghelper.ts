// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import walletHelper from "../repositories/wallets";

export default class LogHelper {
  private existingPairSet: Set<string> = new Set();
  private existingPairs: {
    wallet: Common.Address;
    contract: Common.Address;
  }[] = [];
  private chain: Models.Contract.ChainIdentifier;
  private transferEvents: Models.Contract.TransferEvent[] = [];

  constructor(chain: Models.Contract.ChainIdentifier) {
    this.chain = chain;
  }

  private handleAddressPair(wallet: Common.Address, contract: Common.Address) {
    if (!this.existingPairSet.has(wallet + contract)) {
      this.existingPairSet.add(wallet + contract);
      this.existingPairs.push({ wallet, contract });
    }
  }

  public handleTransfer(event: Models.Contract.TransferEvent) {
    this.transferEvents.push(event);
    this.handleAddressPair(event.from, event.contractAddress);
    this.handleAddressPair(event.to, event.contractAddress);
  }

  public async flush(): Promise<{
    updated: Awaited<ReturnType<typeof walletHelper.getWalletContractBalances>>;
  }> {
    // lowest blocknumbers first
    const transferEvents = this.transferEvents;
    const existingPairs = this.existingPairs;
    const existingPairSet = this.existingPairSet;
    this.transferEvents = [];
    this.existingPairs = [];
    this.existingPairSet = new Set();

    transferEvents.sort((a, b) => a.blockNumber - b.blockNumber);
    const balanceDataFromDb = await walletHelper.getWalletContractBalances(existingPairs, this.chain);

    // mapOfMaps is a lightweight two-level mapping for efficient access
    // to the objects in the balanceDataFromDb array
    const mapOfMaps: Map<Common.Address, Map<Common.Address, typeof balanceDataFromDb[0] & { _dirty?: true }>> = new Map();
    for (const data of balanceDataFromDb) {
      let walletMap = mapOfMaps.get(data.walletAddress);
      if (!walletMap) {
        walletMap = new Map();
        mapOfMaps.set(data.walletAddress, walletMap);
      }
      walletMap.set(data.contractAddress, data);
    }

    const executeTransfer = (
      data: typeof balanceDataFromDb[0] & { _dirty?: true },
      ev: Models.Contract.TransferEvent,
      operation: 'gain'|'loss',
    ) => {
      const { balance } = data;
      if (balance.type === "ERC20" && ev.type === "ERC20") {
        if (
          ev.blockNumber > balance.blockHeight ||
          (ev.blockNumber === balance.blockHeight && data._dirty === true) // only apply same-block events if data is already dirty
        ) {
          balance.blockHeight = ev.blockNumber;
          balance.amount = (
            BigInt(balance.amount) +
            (ev.amount * (operation === 'gain' ? 1n : -1n))
          ).toString() as `${number}`;
          data._dirty = true;
        }
      }
      else if (balance.type === "ERC721" && ev.type === "ERC721") {
        if (
          ev.blockNumber > balance.blockHeight ||
          (ev.blockNumber === balance.blockHeight && data._dirty === true) // only apply same-block events if data is already dirty
        ) {
          balance.blockHeight = ev.blockNumber;
          balance.amount = (
            BigInt(balance.amount) +
            (operation === 'gain' ? 1n : -1n)
          ).toString() as `${number}`;
          // Todo: What is this line for?
          // balance.amount = (BigInt(balance.amount) - 1n).toString() as `${number}`;
          if (balance.tokenIds) {
            const idx = balance.tokenIds.findIndex(id => id === ev.tokenId.toString());
            if (operation === 'gain') {
              if (idx === -1) {
                balance.tokenIds.push(ev.tokenId.toString());
              }
            } else {
              if (idx > -1) {
                balance.tokenIds.splice(idx, 1);
              }
            }
          }
          data._dirty = true;
        }
      }
      else if (balance.type === "ERC1155" && ev.type === "ERC1155") {
        if (ev.tokenIds.length !== ev.values.length) {
          console.error("tokenIds and values are of different length", ev);
        } else {
          for (let i = 0; i < ev.tokenIds.length; i++) {
            const tokenId = ev.tokenIds[i];
            const value = ev.values[i];
            const existing = balance.data.find(d => d.tokenId === tokenId.toString());
            if (!!existing) {
              if (
                ev.blockNumber > existing.blockHeight ||
                (ev.blockNumber === existing.blockHeight && data._dirty === true) // only apply same-block events if data is already dirty
              ) {
                existing.blockHeight = ev.blockNumber;
                existing.amount = (
                  BigInt(existing.amount) +
                  (value * (operation === 'gain' ? 1n : -1n))
                ).toString() as `${number}`;
                data._dirty = true;
              }
            }
          }
        }
      }
      else if (balance.type === "LSP7" && ev.type === "LSP7") {
        if (
          ev.blockNumber > balance.blockHeight ||
          (ev.blockNumber === balance.blockHeight && data._dirty === true) // only apply same-block events if data is already dirty
        ) {
          balance.blockHeight = ev.blockNumber;
          balance.amount = (
            BigInt(balance.amount) +
            (ev.amount * (operation === 'gain' ? 1n : -1n))
          ).toString() as `${number}`;
          data._dirty = true;
        }
      }
      else if (balance.type === "LSP8" && ev.type === "LSP8") {
        if (
          ev.blockNumber > balance.blockHeight ||
          (ev.blockNumber === balance.blockHeight && data._dirty === true) // only apply same-block events if data is already dirty
        ) {
          balance.blockHeight = ev.blockNumber;
          balance.amount = (
            BigInt(balance.amount) +
            (operation === 'gain' ? 1n : -1n)
          ).toString() as `${number}`;
          if (balance.tokenIds) {
            const idx = balance.tokenIds.findIndex(id => id === ev.tokenId);
            if (operation === 'gain') {
              if (idx === -1) {
                balance.tokenIds.push(ev.tokenId);
              }
            } else {
              if (idx > -1) {
                balance.tokenIds.splice(idx, 1);
              }
            }
          }
          data._dirty = true;
        }
      }
      else {
        console.error(`Mismatch between event contract types, expected ${balance.type} but got ${ev.type} for contract ${data.contractId} and wallet ${data.walletId}`);
      }
    }

    for (const ev of transferEvents) {
      const fromData = mapOfMaps.get(ev.from)?.get(ev.contractAddress);
      if (!!fromData) {
        executeTransfer(fromData, ev, 'loss');
      }
      const toData = mapOfMaps.get(ev.to)?.get(ev.contractAddress);
      if (!!toData) {
        executeTransfer(toData, ev, 'gain');
      }
    }

    const dirtyData: typeof balanceDataFromDb = [];
    for (const data of balanceDataFromDb) {
      if ((data as any)._dirty === true) {
        delete (data as any)._dirty;
        dirtyData.push(data);
      }
    }
    if (dirtyData.length > 0) {
      await walletHelper.upsertWalletBalances(dirtyData);
    }
    console.log(`LogHelper[${this.chain}]: Handled ${transferEvents.length} events, checked ${balanceDataFromDb.length} existing balances, updated ${dirtyData.length} balances`);

    return {
      updated: dirtyData,
    };
  }
}