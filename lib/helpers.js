/*
*	All Helper Methods
*
*/

//Dependencies
let crypto = require('crypto');
let config = require('./config');

//Define helpers object
let helpers = {};

// Create sha256 hash
helpers.hash = function (str) {
	if(typeof(str) == 'string' && str.length > 0) {
		let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
}

// Parse JSON to object
helpers.parseJsonToObject = function (payload) {
	try {	
		let obj = JSON.parse(payload);
		return obj;
	} catch (e) {
   		return {};
	}
}

// export the module
module.exports = helpers;