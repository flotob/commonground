// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { writeFileSync } from "fs";

//to-do: implement proper healthcheck for mediasoup server
export function fakeHealthcheck() {
	setInterval(async () => {
		writeFileSync('./healthcheck.txt', '0');
	}, 10000);
}