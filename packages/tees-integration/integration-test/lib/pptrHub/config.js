const defConfig = {
    "browsersConfig": {
      "nodes": [{
        "nodeID": "node1",
        "connectionType": "remote",
        "sessionMode": "simple",
        "maxConcurrentSessions": 1
      }]
    }
  }
  
const puppeteerHubUrl = ()=>{
  return process.env.pptrHubHost || 'http://10.32.44.22:7500';
}
    
function getEnvConfig() {
    let config = '';
    if (process.env.pptrHubCofing) {
        config = process.env.pptrHubCofing;
    }
    return config;
}

const getConfig = () => {
    const envConfig = getEnvConfig();
    return envConfig || defConfig;
}
// export {getConfig, puppeteerHubUrl}
module.exports = { getConfig, puppeteerHubUrl }