const {getConfig, puppeteerHubUrl} = require('./config');
const {PuppeteerHubClient} = require('puppeteer_hub_client');

class PptrHubHelper{
    
    constructor(hubUrl = puppeteerHubUrl(), config = getConfig()){
        this.hubUrl = hubUrl ||'';
        this.puppeteerHubClient = new PuppeteerHubClient(this.hubUrl);
        this.config = config || {};
        this.pptrConfig = {};
    }

    async getWebsocketUrlFromHub(nodeConfig) {
        let _nodeConfig = {};
        (Object.entries({
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
        })).forEach(([key,value]) => _nodeConfig[key] = value);

        const data = await this._retryUntilPass(JSON.stringify(_nodeConfig));
    
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

    async _retryUntilPass(body, timeout = 1000, remainingRetries = 5) {
        const response = await this.puppeteerHubClient.acquireNode(body);
        if(response === undefined) throw new Error('not found Puppeteer Hub, Please check you config!!!')
        if(response.success) {
          return response.data;
        } else {
          if (remainingRetries == 0) {
            throw new Error('not found Puppeteer Hub!!!');
          }
          setTimeout(async ()=>{
            await this._retryUntilPass(body, timeout, remainingRetries-1)
          }, timeout, body, remainingRetries);
  
        }
    }  

    async getRemoteNode() {
      const _nodeConfig = this.config.browsersConfig.nodes[0];
      this.pptrConfig = await this.getWebsocketUrlFromHub(_nodeConfig);
      return this.pptrConfig;
    }

    async releaseNode() {
        if (this.pptrConfig.sessionId) {
            const response = await this.puppeteerHubClient.releaseNode(
                this.pptrConfig.sessionId,
            );
            if(response) {
                return true;
            } else {
                console.error(`ERROR:release sessionId Failed: ${this.pptrConfig.sessionId}`);
                return false;
            }
        } else {
            console.warn('not release sessionId');
        }
    }
    
}
module.exports = { PptrHubHelper };