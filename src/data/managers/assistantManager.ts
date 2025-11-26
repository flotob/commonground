// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import chatApi from "data/api/chat";
import { randomString } from "../../util";
import connectionManager from "../appstate/connection";
import initialMessages from "common/assistant/initialMessages";
import type OpenAI from "openai";

type AssistantBroadcastEvent = {
    tabIdent: string;
    event: Events.Chat.Assistant;
};

export type AssistantStatus = {
    dialogId: string;
    status: Extract<Assistant.Status, 'WAITING'|'PROCESSING'|'FINISHED'>;
    model: Assistant.ModelName;
    response: string;
    queueData: API.Chat.AssistantQueueData | null;
};

export type AssistantUpdateEvent = {
    type: 'statusUpdate';
    status: AssistantStatus;
} | {
    type: 'messageComplete';
    dialogId: string;
    message: string;
};

class AssistantManager {
    private tabIdent = randomString(10);
    private broadcastChannel = new BroadcastChannel("cg_assistant");
    private listeners: Set<(event: AssistantUpdateEvent) => void> = new Set();
    private inFunctionCall = false;
    private refreshQueueDataTimeout: any = null;
    private scheduledUpdateTimeout: any = null;
    private _status: AssistantStatus | null = null;
    private completeMessage: string | null = null;

    public get status(): AssistantStatus | null {
        return this._status ? { ...this._status } : null;
    }

    constructor() {
        connectionManager.registerClientEventHandler(
            "cliAssistantEvent",
            event => {
                this.eventHandler(event);
                const chunkEvent: AssistantBroadcastEvent = {
                    tabIdent: this.tabIdent,
                    event: event,
                };
                this.broadcastChannel.postMessage(chunkEvent);
            }
        );

        this.broadcastChannel.onmessage = (event: MessageEvent<AssistantBroadcastEvent>) => {
            if (event.data.tabIdent !== this.tabIdent) {
                this.eventHandler(event.data.event);
            }
        };
    }

    private eventHandler(event: Events.Chat.Assistant) {
        if (!this._status) {
            this._status = {
                dialogId: event.dialogId,
                status: 'WAITING',
                response: '',
                queueData: null,
                model: event.model,
            };
        }
        if (!!this._status.queueData) {
            this._status.queueData = null;
        }
        const { data } = event;
        let extraText = '';
        if (data.type === 'textChunk') {
            if (this.inFunctionCall) {
                this.inFunctionCall = false;
                extraText = '\n```\n';
            }
            if (data.text.startsWith('SIGNAL:')) {
                const status = data.text.split(':')[1] as Assistant.Status;
                if (status === 'REQUEUED') {
                    this._status.status = 'WAITING';
                }
                else {
                    if (status === 'TOO_MANY_REQUEUES') {
                        console.log("Too many re-queues, finishing");
                        this._status.status = 'FINISHED';
                    }
                    else if (status === 'ASSISTANT_UNAVAILABLE') {
                        if (this._status.response.length > 0) {
                            this._status.response += '\n\n';
                        }
                        this._status.response += 'This assistant model is currently unavailable, please try again later.';
                        this._status.status = 'FINISHED';
                    }
                    else {
                        this._status.status = status;
                    }
                }
                if (this._status.status !== 'PROCESSING') {
                    this.completeMessage = this._status.response + extraText;
                    this._status.response = '';
                }
            }
            else {
                this._status.response += extraText + data.text;
            }
        }
        else if (data.type === 'functionCall') {
            if (!this.inFunctionCall) {
                this.inFunctionCall = true;
                extraText = '```tool_code\n';
            }
            this._status.response += extraText + data.text;
        }
        else {
            console.log("Received unknown assistant event", data);
        }
        this.scheduleUpdate();
    }

    private setupQueueUpdateInterval() {
        const updateQueueData = async () => {
            if (!!this._status?.queueData) {
                const { ownPriority, ownScore } = this._status.queueData;
                try {
                    const newQueueData = await chatApi.getAssistantQueueData({ ownPriority, ownScore, model: this._status.model });
                    if (!!this._status?.queueData) {
                        this.refreshQueueDataTimeout = setTimeout(updateQueueData, 3000);
                        this._status.queueData = newQueueData;
                        this.scheduleUpdate();
                    }
                    else {
                        this.refreshQueueDataTimeout = null;
                    }
                }
                catch (error) {
                    console.error("Error refreshing queue data", error);
                }
            }
            else {
                clearTimeout(this.refreshQueueDataTimeout);
                this.refreshQueueDataTimeout = null;
            }
        };
        clearTimeout(this.refreshQueueDataTimeout);
        this.refreshQueueDataTimeout = setTimeout(updateQueueData, 3000);
    }

    private scheduleUpdate() {
        clearTimeout(this.scheduledUpdateTimeout);
        this.scheduledUpdateTimeout = setTimeout(() => {
            if (!this._status) {
                return;
            }
            const listeners = Array.from(this.listeners);
            const statusUpdate = {
                type: 'statusUpdate' as const,
                status: { ...this._status },
            };
            for (const listener of listeners) {
                listener(statusUpdate);
            }
            if (this.completeMessage) {
                const messageComplete = {
                    type: 'messageComplete' as const,
                    dialogId: this._status.dialogId,
                    message: this.completeMessage,
                };
                this.completeMessage = null;
                for (const listener of listeners) {
                    listener(messageComplete);
                }
            }
        }, 0);
    }

    public getNewChat(options: {
        template: Extract<API.Chat.AssistantTemplate, 'community_v1'>;
        communityTitle: string;
    } | {
        template: Extract<API.Chat.AssistantTemplate, 'user_v1'>;
        userDisplayName: string;
    }): OpenAI.Chat.ChatCompletionMessageParam[] {
        let content = '';
        if (options.template === 'community_v1') {
            content = initialMessages.community_v1(options.communityTitle);
        }
        else if (options.template === 'user_v1') {
            content = initialMessages.user_v1(options.userDisplayName);
        }
        const result: OpenAI.Chat.ChatCompletionMessageParam[] = [{
            role: 'assistant',
            content,
        }];
        return result;
    }

    public async getExistingChat({
        communityId,
        dialogId,
    }: {
        communityId?: string;
        dialogId: string;
    }): Promise<{
        messages: OpenAI.Chat.ChatCompletionMessageParam[];
        model: Assistant.ModelName;
    }> {
        if (this._status?.dialogId === dialogId && this._status?.status === 'FINISHED') {
            this._status = null;
            this.scheduleUpdate();
        }
        return chatApi.loadAssistantChat({ dialogId });
    }

    public async sendChatMessage({
        message,
        dialogId,
        communityId,
        model,
    }: {
        message: string;
        dialogId: string | null;
        communityId: string | null;
        model: Assistant.ModelName;
    }): Promise<{
        dialogId: string;
        createdAt: string;
    } | null> {
        if ((this._status?.status || 'FINISHED') !== 'FINISHED') {
            throw new Error("Assistant is not finished");
        }
        if (!dialogId) {
            const requestData: API.Chat.startAssistantChat.Request = !!communityId ? {
                template: "community_v1",
                model,
                communityId,
                message,
            } : {
                template: "user_v1",
                model,
                message,
            };
            const {
                dialogId,
                queueData,
                createdAt,
            } = await chatApi.startAssistantChat(requestData);
            this._status = {
                dialogId,
                status: 'WAITING',
                response: '',
                queueData,
                model,
            };
            this.setupQueueUpdateInterval();
            this.scheduleUpdate();
            return {
                dialogId,
                createdAt,
            };
        }
        else {
            const { queueData } = await chatApi.continueAssistantChat({
                dialogId,
                message,
            });
            this._status = {
                dialogId,
                status: 'WAITING',
                response: '',
                queueData,
                model,
            };
            this.setupQueueUpdateInterval();
            this.scheduleUpdate();
            return null;
        }
    }

    public addListener(listener: (event: AssistantUpdateEvent) => void) {
        this.listeners.add(listener);
    }

    public removeListener(listener: (event: AssistantUpdateEvent) => void) {
        this.listeners.delete(listener);
    }
}

const assistantManager = new AssistantManager();
export default assistantManager;