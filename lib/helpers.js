/*
*	All Helper Methods
*
*/

//Dependencies
const crypto = require('crypto');
const https = require('https');
const path  = require('path');
const fs 	= require('fs');
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
			'To' : '+1'+phone,
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

// Get the string content of a template
helpers.getTemplate = function (templateName, data, callback) {
	templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
	data = typeof(data) == 'object' && data !== null ? data : {};
	if(templateName){
		let templateDir = path.join(__dirname, '../templates/');
		console.log(`${templateDir}${templateName}.html`);
		fs.readFile(`${templateDir}${templateName}.html`, 'utf8', (err, str) => {
			if(!err && str && str.length > 0 ) {
				// Do interpolation on the string
				let finalString = helpers.interpolate(str, data);
				callback(false, finalString);
			} else {
				callback('No template could be found.');
			}
		}); 
	} else {
		callback('A valid template name was not specified');
	}
};

// Add the universal header and footer to a string and pass provided data object to interpolate function to fill the data.
helpers.addUniversalTemplates = function (str, data, callback) {
	str = typeof(str) == 'string' && str.length > 0 ? str : '';
	data = typeof(data) == 'object' && data !== null ? data : {};
	// Get the header
	helpers.getTemplate('_header', data, function(err, headerString) {
		if(!err && headerString) {
			// Get the footer
			helpers.getTemplate('_footer', data, function(err, footerString) {
				if(!err && footerString) {
					// Add them all together
					let fullString = headerString+str+footerString;
					callback(false, fullString);
				} else {	
					callback('Could not find the footer template');
				}
			});
		} else {
			callback('Could not find the header template');
		}
	});
};

// Take a given string and a data object and find/replace all the keys within it
helpers.interpolate = function (str, data) {
	str = typeof(str) == 'string' && str.length > 0 ? str : '';
	data = typeof(data) == 'object' && data !== null ? data : {};

	// Add the templatedGlobals do the data object, prepending their key name with "globals"
	for (let keyName in config.templatedGlobals) {
		if(config.templatedGlobals.hasOwnProperty(keyName)){
			data['global.'+keyName] = config.templatedGlobals[keyName];
		}
	}
	console.log(data);
	// For each key in the data object, insert its value into the string at the correct placeholder
	for (let key in data) {
		if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
			let replace = data[key];
			let find = '{'+key+'}';
			str = str.replace(find, replace);
		}
	}
	return str;
};

// export the module
module.exports = helpers;