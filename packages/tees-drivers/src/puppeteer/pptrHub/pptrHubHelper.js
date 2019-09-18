
const {options, puppeteerHubUrl, connectionType} = require('./options');
const { PuppeteerHubClient } = require('puppeteer_hub_client');
const assert = require('assert');
const _ = require('lodash');
const {retryUntilPass} = require('./util');

class PptrHubHelper{
    constructor(){
        this.puppeteerHubUrl = puppeteerHubUrl;
        this.puppeteerHubClient = new PuppeteerHubClient(this.puppeteerHubUrl);
        this.config = options();
        this.nodeConfig = {};
    }

    async getWebsocketUrlFromHub(nodeConfig) {
      let data;
      let _nodeConfig = {};
      const _config = Object.entries({
        system: nodeConfig.system,
        isVM: nodeConfig.isVM,
        networkSimulator: nodeConfig.networkSimulator,
        sessionMode: nodeConfig.sessionMode,
        browserType: nodeConfig.browserType,
        maxConcurrentSessions: nodeConfig.maxConcurrentSessions
      }).filter(item => {
            if(!item.includes(undefined)){
            return item;
          }
      });
      _config.forEach(([key,value]) => _nodeConfig[key] = value)
     
      const response = await this.puppeteerHubClient.acquireNode(JSON.stringify(_nodeConfig))  
      if(response.success) {
        data = response.data;
        console.log(data,'data')
      }

      // let retry = setInterval(async () => {
      //   let response = await this.puppeteerHubClient.acquireNode(JSON.stringify(_nodeConfig))
      //   if(response.success) {
      //     data = response.data;
      //     console.log(data,'data')
      //     clearInterval(retry);
      //   }
      // }, 1000);
      
      // await retryUntilPass(
      //   async () => {
      //     const response = await this.puppeteerHubClient.acquireNode(
      //       _.omitBy(
      //       {
      //         system: nodeConfig.system,
      //         isVM: nodeConfig.isVM,
      //         networkSimulator: nodeConfig.networkSimulator,
      //         sessionMode: nodeConfig.sessionMode,
      //         browserType: nodeConfig.browserType,
      //         maxConcurrentSessions: nodeConfig.maxConcurrentSessions,
      //       },
      //       _.isUndefined,
      //     ),
      //   );
      //   assert.strictEqual(response.success, true);
      //   data = response.data;
      // });
        return {
          connectionType: 'remote',
          puppeteerWSUrl: `ws://${data.node.host}:${data.node.port}`,
          sessionId: data.sessionId,
          system: data.node.system,
          host: data.node.host,
          port: data.node.port,
          browserType: data.node.browserType,
          isVM: data.node.isVM,
          networkSimulator: data.node.networkSimulator,
          maxConcurrentSessions: data.node.maxConcurrentSessions,
          sessionMode: data.node.sessionMode || nodeConfig.sessionMode,
        };
    }

    async getRemoteNode() {
      const _nodeConfig = this.config.browsersConfig.nodes[0];
      this.nodeConfig = await this.getWebsocketUrlFromHub(_nodeConfig);
      this.deactivated = false;
      return this.nodeConfig;
    }

    async releaseNode() {
        if (this.nodeConfig.sessionId && !this.deactivated) {
          await retryUntilPass(
            async () => {
              console.info(`release sessionId: ${this.nodeConfig.sessionId}`);
              const response = await this.puppeteerHubClient.releaseNode(
                this.nodeConfig.sessionId,
            );
            assert.ok(response === true);
          })  
        }
        this.deactivated = true;
        return true;
    }
    
    async getConnType() {
        return connectionType;
    }
}
module.exports = {PptrHubHelper};