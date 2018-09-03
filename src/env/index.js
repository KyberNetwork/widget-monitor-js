

const loadBlockchainInfo = (network) => {
  var config
  , config_file = (network || 'ropstan') + '.json';

  try {
    config = require('./config-env/' + (config_file));
  } catch (err) {
    if (err.code && err.code === 'MODULE_NOT_FOUND') {
      console.error('No config file matching ENV=' + config_file);
      // process.exit(1);
    } else {
      throw err;
    }
  }

  return config
}

module.exports = loadBlockchainInfo
