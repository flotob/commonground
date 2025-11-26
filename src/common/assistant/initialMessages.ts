// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md



const initialMessages = {
    community_v1: (communityTitle: string) => `Hi! I am the assistant for the ${communityTitle} community. How can I help you today?`,
    user_v1: (userDisplayName: string) => `Hi ${userDisplayName}! I am your personal assistant. How can I help you today?`,
};

export default initialMessages;