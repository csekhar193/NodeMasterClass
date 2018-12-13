/*
*	Server file
*
*/

// Dependencies
const http  = require('http');
const https = require('https');
const url   = require('url');
const fs    = require('fs');
const path  = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

let config   = require('./config');
let _data    = require('./data');
let handlers = require('./handlers');
let helpers = require('./helpers');

// Create Server Object
let server = {};

server.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem')),
}

server.httpsServer = https.createServer(server.httpsServerOptions ,function (req, res) {
	server.unifiedServer(req, res);
});

server.httpServer = http.createServer(function (req, res) {
	server.unifiedServer(req, res);
});

// All the server logic for HTTP and HTTPS server
server.unifiedServer = function (req, res) {
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
		let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

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
server.router = {
	'ping' : handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
};

server.init = function () {
	// Listen to HTTP SERVER
	server.httpServer.listen(config.httpPort, function () {
		console.log(`This app is listening on port ${config.httpPort} in ${config.envName} mode of HTTP Server.`);
	});

	// Listen to HTTPS SERVER
	server.httpsServer.listen(config.httpsPort, function () {
		console.log(`This app is listening on port ${config.httpsPort} in ${config.envName} mode of HTTPS Server.`);
	});
}

//export the module
module.exports = server;

