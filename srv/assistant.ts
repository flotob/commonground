// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import assistantQueue from './assistant/queue';

assistantQueue.startQueuedAssistantServer();

process.on("SIGTERM", async () => {
    assistantQueue.stopQueuedAssistantServer();
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.exit(0);
});