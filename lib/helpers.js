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

// Create a random token with the give length
helpers.createRandomString = function (stringLength) {
	stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;
	if( stringLength ) {
		// Define all the possible characters that could go into a string
		let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
		// start the final string
		let str = '';

		for (let i = 1;  i <= stringLength; i++ ) {
			let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
			str += randomCharacter;
		}
		// return the final string
		return str;
	} else {
		return false;
	}
}

// export the module
module.exports = helpers;