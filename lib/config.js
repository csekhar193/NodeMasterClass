// Declare the environment variable object environment
let environmentVariable = {};

// Add the development property to environmentVarable
environmentVariable.development = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'development',
	'hashingSecret' : 'ThisIsASecret', 
	'maxChecks' : 5,
	'twilio' : {
		'accountSId' : '',
		'authToken'  : '',
		'fromPhone'  : ''
	}
}

// Add the production property to environmentVarable
environmentVariable.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecret' : 'ThisIsAlsoASecret',
	'maxChecks' : 5
}

// Select the appropriate property with NODE_ENV, if not set development as default selected property
let selectedProperty = typeof(environmentVariable[process.env.NODE_ENV]) == 'object' ? environmentVariable[process.env.NODE_ENV] : environmentVariable['development'];

//Export the selected property
module.exports = selectedProperty;





