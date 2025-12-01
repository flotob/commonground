// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";
import { BotInfo, CommunityBotInfo } from "components/templates/CommunityLobby/BotsManagement/BotsManagement";

// Request/Response types for Bot API
interface CreateBotRequest {
  name: string;
  displayName: string;
  description?: string;
  webhookUrl?: string;
}

interface CreateBotResponse {
  bot: BotInfo;
  token: string;
  webhookSecret: string | null;
}

interface UpdateBotRequest {
  botId: string;
  displayName?: string;
  description?: string;
  webhookUrl?: string;
}

interface UpdateBotResponse {
  bot: BotInfo;
}

interface DeleteBotRequest {
  botId: string;
}

interface DeleteBotResponse {
  success: boolean;
}

interface RegenerateTokenRequest {
  botId: string;
}

interface RegenerateTokenResponse {
  token: string;
}

interface GetMyBotsRequest {
  // empty
}

interface GetMyBotsResponse {
  bots: BotInfo[];
}

interface GetBotByIdRequest {
  botId: string;
}

interface GetBotByIdResponse {
  bot: BotInfo | null;
}

interface AddBotToCommunityRequest {
  communityId: string;
  botId: string;
  enabledChannelIds?: string[];
}

interface AddBotToCommunityResponse {
  success: boolean;
}

interface RemoveBotFromCommunityRequest {
  communityId: string;
  botId: string;
}

interface RemoveBotFromCommunityResponse {
  success: boolean;
}

interface UpdateCommunityBotRequest {
  communityId: string;
  botId: string;
  enabledChannelIds?: string[] | null;
}

interface UpdateCommunityBotResponse {
  success: boolean;
}

interface GetCommunityBotsRequest {
  communityId: string;
}

interface GetCommunityBotsResponse {
  bots: CommunityBotInfo[];
}

class BotsApiConnector extends BaseApiConnector {
  constructor() {
    super('Bot');
  }

  // ============================================
  // Bot Ownership (user session auth)
  // ============================================

  public async createBot(data: CreateBotRequest) {
    return await this.ajax<CreateBotResponse>('POST', '/createBot', data);
  }

  public async updateBot(data: UpdateBotRequest) {
    return await this.ajax<UpdateBotResponse>('POST', '/updateBot', data);
  }

  public async deleteBot(data: DeleteBotRequest) {
    return await this.ajax<DeleteBotResponse>('POST', '/deleteBot', data);
  }

  public async regenerateToken(data: RegenerateTokenRequest) {
    return await this.ajax<RegenerateTokenResponse>('POST', '/regenerateToken', data);
  }

  public async getMyBots(data: GetMyBotsRequest) {
    return await this.ajax<GetMyBotsResponse>('POST', '/getMyBots', data);
  }

  public async getBotById(data: GetBotByIdRequest) {
    return await this.ajax<GetBotByIdResponse>('POST', '/getBotById', data);
  }

  // ============================================
  // Community Bot Management (user auth + permissions)
  // ============================================

  public async addBotToCommunity(data: AddBotToCommunityRequest) {
    return await this.ajax<AddBotToCommunityResponse>('POST', '/addBotToCommunity', data);
  }

  public async removeBotFromCommunity(data: RemoveBotFromCommunityRequest) {
    return await this.ajax<RemoveBotFromCommunityResponse>('POST', '/removeBotFromCommunity', data);
  }

  public async updateCommunityBot(data: UpdateCommunityBotRequest) {
    return await this.ajax<UpdateCommunityBotResponse>('POST', '/updateCommunityBot', data);
  }

  public async getCommunityBots(data: GetCommunityBotsRequest) {
    return await this.ajax<GetCommunityBotsResponse>('POST', '/getCommunityBots', data);
  }
}

const botsApi = new BotsApiConnector();
export default botsApi;
