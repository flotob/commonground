// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { writeFileSync } from "fs";
import pool from './util/postgres';
import dayjs from 'dayjs';
import redisManager from './redis';

export async function healthcheckHandler() {
	try {
		await queryDb();
		return true;
	} catch (e) {
		return false
	}
}

async function queryDb() {
	let query = `
			insert into logging (service, data)
			values('healthcheck', $1)
		`;
	const dbResult = await pool.query(query, [{ datetime: dayjs().toISOString() }]);
	return dbResult;
}

async function checkRedis() {
	let status = true;
	const legacyMode = process.env.REDIS_LEGACY_MODE === 'true';
	const dataClient = redisManager.getClient("data");
	const socketIOClient = redisManager.getClient("socketIOPub");
	const sessionClient = redisManager.getClient("session");
	await pingRedisClient(dataClient);
	await pingRedisClient(socketIOClient);
	await pingRedisClient(sessionClient, legacyMode);
	return status;
}

async function pingRedisClient(client: any, legacyMode?: boolean): Promise<boolean> {
	if (legacyMode) {
		return new Promise((resolve, reject) => {
			client.ping((err: unknown, value: string | null) => {
				if (err) {
					reject(err);
				} else {
					const result = value === 'PONG';
					resolve(result);
				}
			});
		});
	} else {
		const response = await client.ping();
		if (response === 'PONG') {
			return true;
		} else {
			return false;
		}
	}
}

export function startHealthcheck() {
	setInterval(async () => {
		const dbStatus = await healthcheckHandler();
		const redisStatus = await checkRedis();
		if (dbStatus && redisStatus) {
			writeFileSync('./healthcheck.txt', '0');
		} else {
			writeFileSync('./healthcheck.txt', '1');
		}
	}, 10000);
}

//to-do: implement proper healthcheck for mediasoup server
export function fakeHealthcheck() {
	setInterval(async () => {
		writeFileSync('./healthcheck.txt', '0');
	}, 10000);
}
