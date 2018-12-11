const http  = require('http');
const https = require('https');
const url   = require('url');
const fs    = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

let config   = require('./lib/config');
let _data    = require('./lib/data');
let handlers = require('./lib/handlers');
let helpers = require('./lib/helpers');

let httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem'),
}

const httpsServer = https.createServer(httpsServerOptions ,function (req, res) {
	unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function () {
	console.log(`This app is listening on port ${config.httpsPort} in ${config.envName} mode of HTTPS Server.`);
});

const httpServer = http.createServer(function (req, res) {
	unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function () {
	console.log(`This app is listening on port ${config.httpPort} in ${config.envName} mode of HTTP Server.`);
});

// All the server logic for HTTP and HTTPS server
let unifiedServer = function (req, res) {
	const parsedURL = url.parse(req.url, true);
	const path = parsedURL.pathname;
	const trimmedPath = path.replace(/^\/+|\/+$/g, '');
	const method = req.method.toLowerCase();

	let queryStringObject = parsedURL.query;
	let headers = req.headers;
	let decoder = new StringDecoder('utf-8');
	let buffer  = '';

	req.on('data', function(data){
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		//Choose the handler this request should go to. If one is not found use not Found handler
		let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct a data object to send to the handler
		let data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			payload: helpers.parseJsonToObject(buffer)
		};

		// Route the request to the handler specified in the router
		chosenHandler(data, function (statuscode, payload) {
			// use Status code call back by the handler, or default to 200
			statuscode = typeof(statuscode) == 'number' ? statuscode : 200;

			// use the payload called back by the handler, or default to empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			let payloadString = JSON.stringify(payload);

			// Return the response
			res.setHeader('Content-Type' , 'application/json');
			res.writeHead(statuscode);
			res.end(payloadString);

			// Log the response
			console.log(`Returning in the response with status code as ${statuscode} and payload as ${payload}`);

		});
	})

}

//Define a request router
var router = {
	'ping' : handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens
};

