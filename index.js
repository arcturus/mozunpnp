const internalIp = require('internal-ip');
const request = require('request');
const DEFAULT_UNPNP_REGISTER_SERVICE = 'https://knilxof.org:4443/register';
const DEFAULT_UNPNP_PING_SERVICE = 'https://knilxof.org:4443/ping';
const DEFAULT_UNPNP_REGISTER_INTERVAL = 5 * 60 * 1000; // 5 minutes

function fetch(url, opts) {
  return new Promise((resolve, reject) => {
    const options = Object.assign(opts || {}, {rejectUnauthorized: false, url});
    request(options, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      resolve(body);
    });
  });
}

function MozUNPNP(config) {
  const defaults = {
    registerService: process.env.UNPNP_REGISTER_SERVICE ||
      DEFAULT_UNPNP_REGISTER_SERVICE,
    registerInterval: process.env.UNPNP_REGISTER_INTERVAL ||
      DEFAULT_UNPNP_REGISTER_INTERVAL,
    pingService: process.env.UNPNP_PING_SERVICE ||
      DEFAULT_UNPNP_PING_SERVICE
  }

  this.config = Object.assign(defaults, config);
  this.intervalId = null;
}

// Registration functions

MozUNPNP.prototype.registerOnce = function(client, message) {
  const ipv4 = internalIp.v4();

  message['local_ip'] = ipv4;
  const payload = {
    client,
    message: JSON.stringify(message)
  };

  return fetch(this.config.registerService, {
    method: 'POST',
    form: JSON.stringify(payload)
  });
};

MozUNPNP.prototype.register = function(client, message) {
  const self = this;
  this.registerOnce(client, message);
  this.intervalId = setInterval(() => {
    self.registerOnce(client, message);
  }, this.config.registerInterval);
};

MozUNPNP.prototype.stopRegistration = function() {
  clearInterval(this.intervalId);
};

// Client readying functions
MozUNPNP.prototype.read = function() {
  return fetch(this.config.pingService);
};

module.exports = MozUNPNP;
