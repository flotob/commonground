// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import redisManager from '../redis';
import eventHelper from '../repositories/event';
import { messageToPlainText } from './helpers';
import { loadMessages, loadMessageRange, MessageData } from './data/messages';
import dayjs from 'dayjs';
import { updateDialogItem } from './data/dialog';
import { getModelAvailability } from './data/assistant';
import config from '../common/config';
import { dockerSecret } from '../util';
import OpenAI from 'openai';

const dataClient = redisManager.getClient('data');

const maxRequeues = 50;
const maxPriority = 3;
export type Priority = 0 | 1 | 2 | 3;

const SORTED_SET_PREFIX = 'Assistant_SortedSet_';
const HASH_NAME = 'Assistant_Queue_Data';
const MAX_QUEUE_LENGTH = 100;
export const QUEUE_FULL_ERROR = 'Queue is full';
const AVAILABLE_ASSISTANTS_UPDATE_INTERVAL = 1000 * 30;

const useLocalLlama = config.DEPLOYMENT === "dev" ? true : false;

const getSortedSetKey = (priority: Priority, model: Assistant.ModelName) => `${SORTED_SET_PREFIX}${priority}_${model}`;

class AssistantQueue {
    serverRunning = false;
    handlerRunning: {[key in Assistant.ModelName]: boolean} = {
        'gemma3_1-27b-it': false,
        'mistral-small-3.1-24b-instruct': false,
        'qwen2_5-32b-instruct': false,
        'qwen3_14b-instruct': false,
    };
    availableAssistants: Map<Assistant.ModelName, {
        modelName: Assistant.ModelName;
        title: string;
        domain: string;
        isAvailable: boolean;
    }> = new Map();
    availableAssistantsUpdateTimeout: any = null;
    availableAssistantsLastUpdate: number = 0;
    stopGenerationHandler: (() => void) | null = null;
    executingItem: Assistant.Request | null = null;
    isReady: Promise<void> = Promise.resolve();
    prioClients: Record<string, ReturnType<typeof redisManager['getClient']>> = {};
    prioUserIdsByModel: {[key in Assistant.ModelName]: (string | null)[]} = {
        'gemma3_1-27b-it': new Array(maxPriority + 1).fill(null),
        'mistral-small-3.1-24b-instruct': new Array(maxPriority + 1).fill(null),
        'qwen2_5-32b-instruct': new Array(maxPriority + 1).fill(null),
        'qwen3_14b-instruct': new Array(maxPriority + 1).fill(null),
    };

    constructor() {
        this.getNextItem = this.getNextItem.bind(this);
        this.handleQueuedRequests = this.handleQueuedRequests.bind(this);
        this.updateAvailableAssistants = this.updateAvailableAssistants.bind(this);
    }

    public async addQueueItem({
        request,
        dialogId,
        userId,
        deviceId,
        priority,
        requeuedCount,
    }: {
        request: Assistant.Request;
        dialogId: string;
        userId: string;
        deviceId: string;
        priority: Priority;
        requeuedCount?: number;
    }) {
        if (!this.serverRunning && this.availableAssistantsLastUpdate < Date.now() - AVAILABLE_ASSISTANTS_UPDATE_INTERVAL) {
            await this.updateAvailableAssistants();
        }
        if (requeuedCount === undefined) {
            requeuedCount = 0;
        }
        this.checkPriority(priority);
        const assistant = this.availableAssistants.get(request.model);
        if (!assistant?.isAvailable) {
            throw new Error('Assistant is not available');
        }
        const now = Date.now();
        const sortedSetKey = getSortedSetKey(priority, request.model);
        const queueLength = await dataClient.zCard(sortedSetKey);
        if (queueLength >= MAX_QUEUE_LENGTH) {
            throw new Error(QUEUE_FULL_ERROR);
        }
        const queueItem: Assistant.QueueItem = { request, dialogId, userId, deviceId, timestamp: now, requeuedCount };
        await dataClient.hSet(HASH_NAME, userId, JSON.stringify(queueItem));
        await dataClient.zAdd(sortedSetKey, { score: now, value: userId });
        return this.getQueueData({ priority, score: now, model: request.model });
    }

    public async getQueueData({
        priority,
        score,
        model,
    }: {
        priority: Priority;
        score: number;
        model: Assistant.ModelName;
    }) {
        this.checkPriority(priority);
        const sortedSetKey = getSortedSetKey(priority, model);
        const queueData: API.Chat.AssistantQueueData = {
            ownPriority: priority,
            ownScore: score,
            queuedBefore: [],
        };
        for (let prio = 0; prio <= priority; prio++) {
            if (prio === priority) {
                const count = await dataClient.zCount(sortedSetKey, '-inf', score - 1);
                queueData.queuedBefore.push([prio, count]);
            }
            else {
                const count = await dataClient.zCard(getSortedSetKey(priority, model));
                queueData.queuedBefore.push([prio as Priority, count]);
            }
        }
        return queueData;
    }

    public async cancelQueueItem({
        userId,
        priority,
        model,
    }: {
        userId: string,
        priority: Priority,
        model: Assistant.ModelName,
    }) {
        this.checkPriority(priority);
        const sortedSetKey = getSortedSetKey(priority, model);
        await dataClient.zRem(sortedSetKey, userId);
        await dataClient.hDel(HASH_NAME, userId);
    }

    public async startQueuedAssistantServer() {
        if (!this.serverRunning) {
            this.serverRunning = true;

            // update available assistants
            this.isReady = this.updateAvailableAssistants();
            await this.isReady;
        }       
    }

    public async stopQueuedAssistantServer() {
        this.serverRunning = false;
        clearTimeout(this.availableAssistantsUpdateTimeout);
        this.stopGenerationHandler?.();
    }

    private async startAssistantDataClients(modelName: Assistant.ModelName) {
        if (!this.serverRunning) {
            return;
        }
        console.log("Starting assistant data clients for", modelName);
        for (let priority = 0; priority <= maxPriority; priority++) {
            const sortedSetKey = getSortedSetKey(priority as Priority, modelName);
            const client = dataClient.duplicate();
            await client.connect();
            this.prioClients[sortedSetKey] = client;
            this.getNextItem(priority as Priority, modelName);
        }
    }

    private async stopAssistantDataClients(modelName: Assistant.ModelName) {
        console.log("Stopping assistant data clients for", modelName);
        for (let priority = 0; priority <= maxPriority; priority++) {
            const sortedSetKey = getSortedSetKey(priority as Priority, modelName);
            await this.prioClients[sortedSetKey]?.disconnect();
            delete this.prioClients[sortedSetKey];
        }
    }

    private async updateAvailableAssistants() {
        try {
            const newAvailableAssistants = await getModelAvailability();
            const oldModelNames = new Set(this.availableAssistants.keys());
            for (const newAssistant of newAvailableAssistants) {
                oldModelNames.delete(newAssistant.modelName);
                const existingAssistant = this.availableAssistants.get(newAssistant.modelName);
                if (newAssistant.isAvailable) {
                    if (!existingAssistant?.isAvailable) {
                        await this.startAssistantDataClients(newAssistant.modelName);
                    }
                }
                else {
                    if (existingAssistant?.isAvailable) {
                        await this.stopAssistantDataClients(newAssistant.modelName);
                    }
                }
                this.availableAssistants.set(newAssistant.modelName, newAssistant);
            }
            for (const modelName of oldModelNames) {
                await this.stopAssistantDataClients(modelName);
                this.availableAssistants.delete(modelName);
            }
            this.availableAssistantsLastUpdate = Date.now();
        }
        catch (e) {
            console.error("Error updating available assistants", e);
        }
        finally {
            if (this.serverRunning) {
                this.availableAssistantsUpdateTimeout = setTimeout(this.updateAvailableAssistants, AVAILABLE_ASSISTANTS_UPDATE_INTERVAL);
            }
        }
    }

    private checkPriority(priority: Priority) {
        if (Math.floor(priority) !== priority || priority < 0 || priority > maxPriority) {
            throw new Error('Invalid priority');
        }
    }

    private async getNextItem(priority: Priority, model: Assistant.ModelName) {
        await this.isReady;
        const assistant = this.availableAssistants.get(model);
        if (!assistant?.isAvailable) {
            return;
        }
        try {
            const sortedSetKey = getSortedSetKey(priority, model);
            const client = this.prioClients[sortedSetKey];
            if (!client) {
                throw new Error("No client found for " + sortedSetKey);
            }
            // console.log("Getting next item for", sortedSetKey);
            let userIdData: { value: string, score: number } | null = await client.bzPopMin(sortedSetKey, 1000);
            if (!!userIdData) {
                console.log("Got next item", priority, userIdData);
                this.prioUserIdsByModel[model][priority] = userIdData.value;
                if (!this.handlerRunning[model]) {
                    this.handleQueuedRequests(model);
                }
            } else {
                throw new Error('No user ID found');
            }
        } catch (e) {
            if (e instanceof Error && e.message === 'No user ID found') {
                if (this.serverRunning) {
                    setTimeout(this.getNextItem, 0, priority, model);
                }
            } else {
                console.error("Unexpected error getting next item", e);
                if (this.serverRunning) {
                    setTimeout(this.getNextItem, 1000, priority, model);
                }
            }
        }
    }

    private async handleQueuedRequests(model: Assistant.ModelName) {
        this.handlerRunning[model] = true;
        let userId: string | null = null;
        let priority: Priority | null = null;
        while (true) {
            if (!this.serverRunning) {
                break;
            }
            for (let _priority = 0; _priority <= maxPriority; _priority++) {
                if (this.prioUserIdsByModel[model][_priority]) {
                    userId = this.prioUserIdsByModel[model][_priority];
                    this.prioUserIdsByModel[model][_priority] = null;
                    priority = _priority as Priority;
                    setTimeout(this.getNextItem, 0, _priority, model);
                    break;
                }
            }
            if (!userId || priority === null) {
                break;
            }
            try {
                await this.generateAssistantResponse(userId, priority);
            } catch (e) {
                console.error("Error generating Assistant response", e);
            }
            userId = null;
        }
        this.handlerRunning[model] = false;
    }

    private async generateAssistantResponse(userId: string, priority: Priority) {
        console.log("Getting item for user", userId);
        const item = await dataClient.hGet(HASH_NAME, userId);
        if (!!item) {
            dataClient.hDel(HASH_NAME, userId).catch(e => console.error("Error deleting item from hash", e));
            const queueItem: Assistant.QueueItem = JSON.parse(item);
            const assistant = this.availableAssistants.get(queueItem.request.model);
            if (!assistant?.isAvailable) {
                this.emitEvent(queueItem, false, "SIGNAL:ASSISTANT_UNAVAILABLE");
                return;
            }

            this.emitEvent(queueItem, false, "SIGNAL:PROCESSING");
            const openai = new OpenAI({
                baseURL: useLocalLlama ? 'http://llama:8000' : `https://${assistant.domain}`,
                apiKey: dockerSecret('ai_api_key') || process.env.AI_API_KEY,
            });
            const events = await openai.chat.completions.create({
                model: queueItem.request.model,
                messages: queueItem.request.messages as any,
                stream: true,
                tools: queueItem.request.tools,
            });

            let contentString = '';
            let toolNames: string[] = [];
            let toolCallsStrings: string[] = [];
            for await (const chunk of events) {
                const content = chunk.choices[0].delta.content;
                const toolCalls = chunk.choices[0].delta.tool_calls || [];
                const finishReason = chunk.choices[0].finish_reason;
                for (const toolCall of toolCalls) {
                    if (toolCall.function?.name) {
                        toolNames[toolCall.index] = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        toolCallsStrings[toolCall.index] = (toolCallsStrings[toolCall.index] || '') + toolCall.function.arguments;
                    }
                }

                if (content) {
                    contentString += content;
                    this.emitEvent(queueItem, false, content);
                }

                if (finishReason) {
                    const newRequest: Assistant.Request = {
                        ...queueItem.request,
                        messages: Array.from(queueItem.request.messages),
                    };
                    if (finishReason === 'tool_calls') {
                        console.log('Tool names', toolNames);
                        console.log('Tool calls strings', toolCallsStrings);
                        const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
                        const toolResults: any[] = [];
                        for (let i = 0; i < toolNames.length; i++) {
                            if (!toolNames[i] || !toolCallsStrings[i]) {
                                console.warn('Tool call missing', toolNames[i], toolCallsStrings[i]);
                                continue;
                            }
                            toolCalls.push({
                                id: Math.random().toString().slice(2,12),
                                type: 'function' as const,
                                function: {
                                    name: toolNames[i],
                                    arguments: toolCallsStrings[i],
                                },
                            });
                            const toolCall = toolCalls[toolCalls.length - 1];
                            this.emitEvent(queueItem, true, JSON.stringify(toolCall));
                            try {
                                const result = await this.executeFunctionCall(queueItem, toolCall);
                                toolResults.push(result);
                            } catch (e) {
                                toolResults.push({ error: "Error executing function call: " + (e instanceof Error ? e.message : "An unknown error occurred") });
                            }
                        }
                        if (toolNames.length > 0) {
                            this.emitEvent(queueItem, false, "");
                        }
                        newRequest.messages.push({
                            role: "assistant",
                            content: contentString,
                            tool_calls: toolCalls,
                        });
                        for (let i = 0; i < toolResults.length; i++) {
                            newRequest.messages.push({
                                role: "tool",
                                content: JSON.stringify(toolResults[i]),
                                tool_call_id: toolCalls[i].id,
                            });
                        }
                        if (queueItem.requeuedCount < maxRequeues) {
                            console.log("Adding new queue item", newRequest.messages);
                            await this.addQueueItem({
                                request: newRequest,
                                dialogId: queueItem.dialogId,
                                userId,
                                deviceId: queueItem.deviceId,
                                priority,
                                requeuedCount: queueItem.requeuedCount + 1
                            });
                            this.emitEvent(queueItem, false, "SIGNAL:REQUEUED");
                        }
                        else {
                            this.emitEvent(queueItem, false, "SIGNAL:TOO_MANY_REQUEUES");
                        }
                    }
                    else {
                        newRequest.messages.push({
                            role: "assistant",
                            content: contentString,
                        });
                        if (finishReason !== 'stop' && finishReason !== 'length') {
                            console.warn("Unexpected finish reason", finishReason);
                        }
                        this.emitEvent(queueItem, false, "SIGNAL:FINISHED");
                    }
                    await updateDialogItem({
                        userId,
                        dialogId: queueItem.dialogId,
                        request: newRequest
                    });
                }
            }
        } else {
            console.error("No item found for user", userId);
        }
    }

    private emitEvent(queueItem: Assistant.QueueItem, inFunctionCall: boolean, text: string) {
        const chunkEvent: Events.Chat.Assistant = {
            type: "cliAssistantEvent",
            dialogId: queueItem.dialogId,
            model: queueItem.request.model,
            data: {
                type: inFunctionCall ? "functionCall" : "textChunk",
                text,
            },
        };
        eventHelper.emit(chunkEvent, {
            deviceIds: [queueItem.deviceId],
        });
    }

    private async executeFunctionCall(queueItem: Assistant.QueueItem, toolCall: OpenAI.Chat.ChatCompletionMessageToolCall) {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            switch (toolCall.function.name) {
                case 'getRecentChannelMessages':
                case 'getChannelMessagesRange':
                    const community = queueItem.request.extraData?.community;
                    const channel = community?.channels[args.channelIndex];
                    if (!channel || !community) {
                        throw new Error('Channel or community not found');
                    }
                    try {
                        let messagesData: MessageData[];
                        if (toolCall.function.name === 'getRecentChannelMessages') {
                            messagesData = await loadMessages(queueItem.userId, channel.channelId, args.limit);
                        }
                        else {
                            messagesData = await loadMessageRange(queueItem.userId, channel.channelId, args.startDate, args.endDate);
                        }
                        const messages = messagesData.reverse().map(message => ({
                            createdAt: dayjs(message.createdAt).format('YYYY-MM-DD HH:mm'),
                            userName: message.displayName,
                            text: messageToPlainText(message.body),
                        }));
                        return messages;
                    } catch (e) {
                        console.error("Error executing function call", e);
                        throw new Error("An unknown error occurred");
                    }
                default:
                    throw new Error("Unknown function name");
            }
        }
        catch (e) {
            console.error("Error executing function call", e);
            throw new Error("Invalid function call");
        }
    }
}

const assistantQueue = new AssistantQueue();

export default assistantQueue;
