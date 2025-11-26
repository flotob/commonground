// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

const getRecentChannelMessages: Assistant.Tool = {
    type: 'function',
    function: {
        name: 'getRecentChannelMessages',
        description: 'Get recent messages from a channel, starting from the most recent.',
        parameters: {
            type: "object",
            properties: {
                channelIndex: {
                    type: 'number',
                    description: 'The list index of the channel to get messages from.',
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of messages to return.',
                },
            },
            required: ['channelIndex', 'limit'],
        }
    },
};

const getChannelMessagesRange: Assistant.Tool = {
    type: 'function',
    function: {
        name: 'getChannelMessagesRange',
        description: 'Get messages from a channel, within a specific time range.',
        parameters: {
            type: "object",
            properties: {
                channelIndex: {
                    type: 'number',
                    description: 'The list index of the channel to get messages from.',
                },
                startDate: {
                    type: 'string',
                    description: 'The start date of the time range to get messages from. Must be in the format YYYY-MM-DD.',
                },
                endDate: {
                    type: 'string',
                    description: 'The end date of the time range to get messages from. Must be in the format YYYY-MM-DD.',
                },
            },
            required: ['channelIndex', 'startDate', 'endDate'],
        }
    },
};

export default {
    getRecentChannelMessages,
    getChannelMessagesRange,
};