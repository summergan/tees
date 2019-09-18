const {PptrHubHelper} = require('./pptrHub/pptrHubHelper');

PptrFactory.prototype = {
    local: function(program, setting) {
        this.createPptr = async function() {
            console.log("local")
            this._browser = await program.launch(setting);
            return this._browser;
        }
        this.closePptr = async function() {
            if (this.nodeConfig.networkSimulator) {
                await this._browser.close();
            } else {
                this._browser.disconnect();
            }
            await this.pptr.releaseNode();
        }
    },
    remote: function(program, setting) {
        this.createPptr = async function() {
            console.log('remote')
            this.pptr = new PptrHubHelper();
            this.nodeConfig = await this.pptr.getRemoteNode();
            const url = `${this.nodeConfig.puppeteerWSUrl}?headless=${setting.headless}`;
            this._browser = await program.connect({ browserWSEndpoint: url })
            return this._browser;
        }
        this.closePptr = async function() {
            await this._browser.close();
        }
    },
}
module.exports = { PptrFactory };