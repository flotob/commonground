// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import functions from "./functions";
import dayjs from "dayjs";
import initialMessages from "../../common/assistant/initialMessages";
import { generalPlatformInformation } from "./common";

const systemMessage = (user: Assistant.UserExtraData) => (
    "You are a a helpful personal assistant for the user " + user.displayName + ". You are on a platform called \"Common Ground\".\n\n" +
    "Today's date is " + dayjs().format('YYYY-MM-DD') + ".\n\n" +
    generalPlatformInformation + "\n\n"
);

const userTemplate: (user: Assistant.UserExtraData, model: Assistant.ModelName) => Assistant.Request = (user, model) => ({
    messages: [
        { role: 'system', content: systemMessage(user) },
        { role: 'assistant', content: initialMessages.user_v1(user.displayName) },
    ],
    tools: [],
    extraData: {
        user,
    },
    model,
});

export default userTemplate;