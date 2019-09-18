const { PptrHubHelper } = require('./pptrHub/pptrHubHelper');
class Pptr {
    constructor(connectType) {
        if (new.target == Pptr) {
            throw new Error('Abstract classes cannot be instantiated!')
        }
        this.type = connectType;
    }
}

class PptrHub extends Pptr {
    constructor(program, setting) {
        super('remote');
        this._program = program;
        this._setting = setting;
    }
    async createPptr() {
        this.pptr = new PptrHubHelper();
        this._nodeConfig = await this.pptr.getRemoteNode();
        const _url = `${this._nodeConfig.puppeteerWSUrl}?headless=${this._setting.headless}`;
        this._browser = await this._program.connect({ browserWSEndpoint: _url })
        return this._browser;
    }
    async closePptr() {
        if (this._nodeConfig.networkSimulator) {
            await this._browser.close();
        } else {
            this._browser.disconnect();
        }
        await this.pptr.releaseNode();
    }

}

class PptrLocal extends Pptr {
    constructor(program, setting) {
        super('local');
        this._program = program;
        this._setting = setting;
    }
    async createPptr() {
        this._browser = await this._program.launch(this._setting);
        return this._browser;
    }
    async closePptr() {
        await this._browser.close();
    }
}

function getAbstractPptrFactory(type) {
    switch (type) {
        case 'local':
            return PptrLocal;
            break;
        case 'remote':
            return PptrHub;
            break;
        default:
            throw new Error('Parameter error, optional parameter: local or remote.');
    }
}

module.exports = { getAbstractPptrFactory }