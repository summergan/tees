const { Query: BaseQuery, Driver: BaseDriver   } = require('tees-drivers/src/puppeteer');
const {PptrHubHelper} = require('./pptrHub/pptr_hub_helper');

class Query extends BaseQuery {
  async getText(...args) {
    return await super.getText(...args);
  }
}
class Driver extends BaseDriver {
  // eslint-disable-next-line no-useless-constructor
  constructor(options, program) {
    super(options, program);
  }

  async run({ configSetting, type, extension = '',executablePath = '' , userDataDir = '', isAuth, isHeadless } = {}) {
    this._isHeadless = isHeadless;
    const isExtension = type === 'extension';
    this.pptr = new PptrHubHelper();
    this.nodeConfig = await this.pptr.getRemoteNode();
    const url = `${this.nodeConfig.puppeteerWSUrl}?headless=${isExtension ? 'false' : this._isHeadless}`;
    console.log(`run url ${url}`)
    this._browser = await this._program.connect({ browserWSEndpoint: url })
  }

  async close() {
    if(this._browser) {
      try {
        if (this.nodeConfig.networkSimulator) {
          await this._browser.close();
        } else {
          await this._browser.disconnect();
        }
        await this._browser.releaseNode();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

module.exports = {
  Query,
  Driver,
};


