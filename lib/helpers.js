/*
*	All Helper Methods
*
*/

//Dependencies
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
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

// Send an SMS message via Twillio
helpers.sendTwilioSms = function (phone, msg, callback) {
	//validate parameters
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
	msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	if( phone && msg) {
		// Configure the request payload
		let payload = {
			'From': config.twilio.fromPhone,
			'To' : '+91'+phone,
			'Body': msg
		}

		// Stringigy the payload
		let stringPayload = querystring.stringify(payload);

		// Configure the request details
		let requestDetails = {
			'protocol' : 'https:',
			'hostname' : 'api.twilio.com',
			'method'   : 'POST',
			'path'	   : '/2010-04-01/Accounts/'+config.twilio.accountSId+'/Messages.json',
			'auth'	   : config.twilio.accountSId+':'+config.twilio.authToken,
			'headers'  : {
				'Content-Type'  : 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}	
		}

		// Instantiate the request object
		let req = https.request(requestDetails, function(res) {
			// Grab the status of the sent request
			var status = res.statusCode;
			// Callback successfully if the reuqest went through
			if(status == 200 || status == 201) {
				callback(false);
			} else {
				callback('Status code returned was '+ status);
			}
		});

		// Bind to the error event so it doesn't get thrown
		req.on ('error', function(e) {
			callback(e);
		});
		// Add the payload
		req.write(stringPayload);
		// End the request
		req.end();
	} else {
		callback('Given parameters were missing or invalid');
	}
}

// export the module
module.exports = helpers;