// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import onchainHelper from '../repositories/onchain';
import format from 'pg-format';
import { Decimal, getExactTokenAmount } from '../common/tokensale/helper';
import { ethers } from 'ethers';

if (isMainThread) {
    throw new Error("TrackTokenSales can only be run as a worker job");
}

const safeTrackingTimeDiff = 1000 * 60 * 15; // 15 minutes
const safeBlockNumberDiff = 1;
const blockRange = 20;

const tokensales = new Map<string, {
    saleContractChain: Models.Contract.ChainIdentifier;
    saleContractAddress: Common.Address;
    saleContractType: Models.Contract.SaleContractType;
    targetTokenChain: Models.Contract.ChainIdentifier;
    targetTokenAddress: Common.Address;
    targetTokenDecimals: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    recentUpdateBlockNumber: number;
}>();

async function setup() {
    const tokensalesResult = await pool.query<{
        id: string;
        saleContractChain: Models.Contract.ChainIdentifier;
        saleContractAddress: Common.Address;
        saleContractType: Models.Contract.SaleContractType;
        targetTokenChain: Models.Contract.ChainIdentifier;
        targetTokenAddress: Common.Address;
        targetTokenDecimals: number;
        startDate: string;
        endDate: string;
        createdAt: string;
        recentUpdateBlockNumber: string;
    }>(`
        SELECT
            id,
            "saleContractChain",
            "saleContractAddress",
            "saleContractType",
            "targetTokenChain",
            "targetTokenAddress",
            "targetTokenDecimals",
            "startDate",
            "endDate",
            "createdAt",
            "recentUpdateBlockNumber"
        FROM tokensales
    `);
    for (const tokensale of tokensalesResult.rows) {
        tokensales.set(tokensale.id, {
            saleContractChain: tokensale.saleContractChain,
            saleContractAddress: tokensale.saleContractAddress,
            saleContractType: tokensale.saleContractType,
            targetTokenChain: tokensale.targetTokenChain,
            targetTokenAddress: tokensale.targetTokenAddress,
            targetTokenDecimals: tokensale.targetTokenDecimals,
            startDate: new Date(tokensale.startDate),
            endDate: new Date(tokensale.endDate),
            createdAt: new Date(tokensale.createdAt),
            recentUpdateBlockNumber: parseInt(tokensale.recentUpdateBlockNumber),
        });
    }
}

async function updateTokenSaleUserDataLoop() {
    console.log("updateTokenSaleUserDataLoop");
    for (const [tokenSaleId, tokensale] of tokensales) {
        if (tokensale.startDate.getTime() < new Date().getTime() + safeTrackingTimeDiff && tokensale.endDate.getTime() > new Date().getTime() - safeTrackingTimeDiff) {
            const { blockNumber } = await onchainHelper.getBlockNumber(tokensale.saleContractChain);
            let fromBlock = tokensale.recentUpdateBlockNumber;
            if (fromBlock === 0) {
                fromBlock = Math.max(blockNumber - safeBlockNumberDiff - 1000, 1); // if not initialized, start from 1000 blocks before
            }
            if (fromBlock <= blockNumber - safeBlockNumberDiff) {
                let events: Models.Contract.SaleInvestmentEventJson[] = [];
                let currentBlock = fromBlock;
                while (currentBlock <= blockNumber - safeBlockNumberDiff) {
                    const toBlock = Math.min(currentBlock + blockRange, blockNumber - safeBlockNumberDiff);
                    console.log("JOB trackTokenSales", tokenSaleId, tokensale.saleContractChain, currentBlock, toBlock);
                    const newEvents = await onchainHelper.getTokensaleEvents(
                        tokensale.saleContractChain,
                        tokensale.saleContractAddress,
                        tokensale.saleContractType,
                        currentBlock,
                        toBlock,
                    );
                    events = events.concat(newEvents);
                    currentBlock = toBlock + 1;
                }
                console.log("JOB trackTokenSales events", tokenSaleId, tokensale.saleContractChain, events);
                events.sort((a, b) => a.investmentId - b.investmentId);

                // handle events
                const client = await pool.connect();
                await client.query(`BEGIN`);
                let totalInvested = new Decimal(0);
                let setTotalInvested = false;
                try {
                    if (events.length > 0) {
                        setTotalInvested = true;
                    }
                    for (const event of events) {
                        const saleProgressBefore = new Decimal(ethers.formatEther(event.bigint_saleProgressBefore));
                        const investedAmount = new Decimal(ethers.formatEther(event.bigint_investedAmount));
                        const totalTokensBought = getExactTokenAmount(saleProgressBefore, investedAmount).mul(new Decimal(10).pow(tokensale.targetTokenDecimals)).floor();
                        totalInvested = new Decimal(event.bigint_saleProgressBefore).plus(new Decimal(event.bigint_investedAmount));
                        await client.query(`
                            WITH update_userdata AS (
                                INSERT INTO tokensale_userdata (
                                    "userId",
                                    "tokenSaleId",
                                    "totalInvested",
                                    "totalTokensBought"
                                ) VALUES ($3, $2, ${format('%L::NUMERIC, %L::NUMERIC', event.bigint_investedAmount, totalTokensBought.toString())})
                                ON CONFLICT ("userId", "tokenSaleId") DO UPDATE SET
                                    "totalInvested" = "tokensale_userdata"."totalInvested" + EXCLUDED."totalInvested",
                                    "totalTokensBought" = "tokensale_userdata"."totalTokensBought" + EXCLUDED."totalTokensBought",
                                    "updatedAt" = NOW()
                            )
                            INSERT INTO tokensale_investments (
                                "investmentId",
                                "tokenSaleId",
                                "userId",
                                "event"
                            ) VALUES ($1, $2, $3, $4::jsonb)
                            ON CONFLICT ("investmentId", "tokenSaleId") DO NOTHING
                        `, [event.investmentId, tokenSaleId, event.userId, JSON.stringify(event)]);
                    }

                    await client.query(`
                        UPDATE tokensales SET "recentUpdateBlockNumber" = $1 ${setTotalInvested ? `, "totalInvested" = ${format('%L', totalInvested.toString())}` : ''}
                        WHERE id = $2
                    `, [currentBlock, tokenSaleId]);
                    tokensale.recentUpdateBlockNumber = currentBlock;

                    await client.query(`COMMIT`);
                }
                catch (e) {
                    console.error("Error handling tokensale events", e);
                    await client.query(`ROLLBACK`);
                }
                finally {
                    client.release();
                }
            }
        }
    }
    setTimeout(updateTokenSaleUserDataLoop, 20_000);
}

(async () => {
    await setup();
    const client = await pool.connect();
    client.query('LISTEN tokensalechange');

    // Keepalive
    let interval: any = undefined;
    interval = setInterval(async () => {
        try {
            await client.query('SELECT 1');
        }
        catch (e) {
            console.log("KEEPALIVE ERROR", e);
            clearInterval(interval);
            process.exit(1);
        }
    }, 60000);

    updateTokenSaleUserDataLoop();

    client.on("notification", (msg) => {
        if (!!msg.payload) {
            try {
                const payload = JSON.parse(msg.payload) as Events.PgNotify.TokensaleChange;
                if (payload && (
                    payload.type === "tokensalechange"
                )) {
                    if (payload.type === "tokensalechange") {
                        console.log("Received tokensalechange event", payload);
                        tokensales.set(payload.id, {
                            saleContractChain: payload.saleContractChain,
                            saleContractAddress: payload.saleContractAddress,
                            saleContractType: payload.saleContractType,
                            targetTokenChain: payload.targetTokenChain,
                            targetTokenAddress: payload.targetTokenAddress,
                            targetTokenDecimals: payload.targetTokenDecimals,
                            recentUpdateBlockNumber: parseInt(payload.recentUpdateBlockNumber),
                            startDate: new Date(payload.startDate),
                            endDate: new Date(payload.endDate),
                            createdAt: new Date(payload.createdAt),
                        });
                    } else {
                        console.warn("Received invalid tokensalechange event", payload);
                    }
                }
            }
            catch (e) {
                console.error("Error processing tokensalechange event", e);
            }
        }
    });
})();