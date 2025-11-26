// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import functions from "./functions";
import dayjs from "dayjs";
import initialMessages from "../../common/assistant/initialMessages";
import { generalPlatformInformation } from "./common";

const systemMessage = (community: Assistant.CommunityExtraData) => (
    "You are a a helpful assistant inside of a community. The community platform is called \"Common Ground\".\n\n" +
    "Today's date is " + dayjs().format('YYYY-MM-DD') + ".\n\n" +
    generalPlatformInformation + "\n\n" +
    `Information about the community to assist the user with:\n` +
    `Community name: ${community.title.replace(/\n/g, ' ')}\n` +
    `Community description: ${community.description.replace(/\n/g, ' ')}\n` +
    `Community channels:\n${community.channels.map((channel, index) => `- ${index}: ${channel.title.replace(/\n/g, ' ')}`).join("\n")}\n\n` +
    `The initial assistant message shown to the user is:\n${initialMessages.community_v1(community.title)}\n\n` +
    `Always respond in the language in which the user addresses you.\n`
);

const communityTemplate: (user: Assistant.UserExtraData, community: Assistant.CommunityExtraData, model: Assistant.ModelName) => Assistant.Request = (user, community, model) => ({
    messages: [
        { role: 'system', content: systemMessage(community) },
    ],
    tools: [functions.getRecentChannelMessages, functions.getChannelMessagesRange],
    extraData: {
        user,
        community,
    },
    model,
});

export default communityTemplate;