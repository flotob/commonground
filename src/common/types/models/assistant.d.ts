// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import type OpenAI from "openai";

declare global {
    namespace Assistant {
        type Message = OpenAI.Chat.ChatCompletionMessageParam;
        type ModelName = 'gemma3_1-27b-it' | 'qwen2_5-32b-instruct' | 'mistral-small-3.1-24b-instruct' | 'qwen3_14b-instruct';

        type Tool = {
            type: 'function';
            function: {
                name: string;
                description: string;
                parameters: {
                    type: "object";
                    properties: {
                        [key: string]: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            }
        };

        type ToolCall = {
            name: string;
            arguments: Record<string, any>;
        };

        type Request = {
            messages: Message[];
            model: ModelName;
            tools: Tool[];
            extraData: {
                user: UserExtraData;
                community?: CommunityExtraData;
            };
        };

        type QueueItem = {
            request: Request;
            dialogId: string;
            userId: string;
            deviceId: string;
            timestamp: number;
            requeuedCount: number;
        };

        type CommunityExtraData = {
            communityId: string;
            title: string;
            description: string;
            channels: {
                channelId: string;
                emoji: string | null;
                title: string;
            }[];
        };

        type UserExtraData = {
            userId: string;
            displayName: string;
        };

        type Status = 'WAITING'|'PROCESSING'|'REQUEUED'|'FINISHED'|'TOO_MANY_REQUEUES'|'ASSISTANT_UNAVAILABLE';
    }
}