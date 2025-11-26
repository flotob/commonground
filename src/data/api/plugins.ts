// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class PluginsApiConnector extends BaseApiConnector {
  constructor() {
    super('Plugins');
  }

  public async createPlugin(data: API.Plugins.createPlugin.Request) {
    return await this.ajax<API.Plugins.createPlugin.Response>('POST', '/createPlugin', data);
  }

  public async clonePlugin(data: API.Plugins.clonePlugin.Request) {
    return await this.ajax<API.Plugins.clonePlugin.Response>('POST', '/clonePlugin', data);
  }

  public async updatePlugin(data: API.Plugins.updatePlugin.Request) {
    return await this.ajax<API.Plugins.updatePlugin.Response>('POST', '/updatePlugin', data);
  }

  public async deletePlugin(data: API.Plugins.deletePlugin.Request) {
    return await this.ajax<API.Plugins.deletePlugin.Response>('POST', '/deletePlugin', data);
  }

  public async acceptPluginPermissions(data: API.Plugins.acceptPluginPermissions.Request) {
    return await this.ajax<API.Plugins.acceptPluginPermissions.Response>('POST', '/acceptPluginPermissions', data);
  }

  public async pluginRequest(data: API.Plugins.pluginRequest.Request) {
    return await this.ajax<API.Plugins.pluginRequest.Response>('POST', '/pluginRequest', data);
  }

  public async getAppstorePlugin(data: API.Plugins.getAppstorePlugin.Request) {
    return await this.ajax<API.Plugins.getAppstorePlugin.Response>('POST', '/getAppstorePlugin', data);
  }

  public async getAppstorePlugins(data: API.Plugins.getAppstorePlugins.Request) {
    return await this.ajax<API.Plugins.getAppstorePlugins.Response>('POST', '/getAppstorePlugins', data);
  }

  public async getPluginCommunities(data: API.Plugins.getPluginCommunities.Request) {
    return await this.ajax<API.Plugins.getPluginCommunities.Response>('POST', '/getPluginCommunities', data);
  }
}

const pluginsApi = new PluginsApiConnector();
export default pluginsApi;