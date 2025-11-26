// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { CallType } from "common/enums";

let protooPort = 4443;

export function getProtooUrl({
	roomId,
	peerId,
	consumerReplicas,
	callServerUrl,
	callType,
	callCreator,
}: {
	roomId: string,
	peerId: string,
	consumerReplicas: number,
	callServerUrl: string,
	callType: CallType,
	callCreator: string,
}) {
	return `wss://${callServerUrl}:${protooPort}/?roomId=${roomId}&peerId=${peerId}&consumerReplicas=${consumerReplicas}&callCreator=${callCreator}&callType=${callType}`;
}