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

		// if the choosen handler is within the public then use public handler as default
		chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

		// Construct a data object to send to the handler
		let data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			payload: helpers.parseJsonToObject(buffer)
		};

		// Route the request to the handler specified in the router
		chosenHandler(data, function (statuscode, payload, contentType) {
			// Determine the response type
			contentType = typeof(contentType) == 'string' ? contentType : 'json';

			// use Status code call back by the handler, or default to 200
			statuscode = typeof(statuscode) == 'number' ? statuscode : 200;

			// Return the response-parts that are content-specific
			let payloadString = '';
			if(contentType == 'json') {
				res.setHeader('Content-Type' , 'application/json');
				payload = typeof(payload) == 'object' ? payload : {};
				payloadString = JSON.stringify(payload);
			}


			if(contentType == 'html') {
				res.setHeader('Content-Type' , 'text/html');
				payloadString = typeof(payload) == 'string' ? payload : {};
			}

			if(contentType == 'favicon') {
				res.setHeader('Content-Type' , 'image/x-icon');
				payloadString = typeof(payload) !== undefined ? payload : {};
			}

			if(contentType == 'css') {
				res.setHeader('Content-Type' , 'text/css');
				payloadString = typeof(payload) !== undefined ? payload : {};
			}

			if(contentType == 'png') {
				res.setHeader('Content-Type' , 'image/png');
				payloadString = typeof(payload) !== undefined ? payload : {};
			}

			if(contentType == 'jpg') {
				res.setHeader('Content-Type' , 'image/jpeg');
				payloadString = typeof(payload) !== undefined ? payload : {};
			}

			if(contentType == 'plain') {
				res.setHeader('Content-Type' , 'text/plain');
				payloadString = typeof(payload) !== undefined ? payload : {};
			}

			// Return the response-parts that are common to all content-types
			res.writeHead(statuscode);
			console.log(payloadString);
			res.end(payloadString);

			// Log the response
			console.log(`Returning in the response with status code as ${statuscode} and payload as ${payload}`);

		});
	})

}

//Define a request router
server.router = {
	'' : handlers.index,
	'account/create': handlers.accountCreate,
	'account/deleted': handlers.accountDeleted,
	'account/edit': handlers.accountEdit,
	'session/create': handlers.sessionCreate,
	'session/deleted': handlers.sessionDeleted,
	'checks/all': handlers.checksList,
	'checks/create': handlers.checksCreate,
	'checks/edit': handlers.checksEdit,
	'ping' : handlers.ping,
	'api/users': handlers.users,
	'api/tokens': handlers.tokens,
	'api/checks': handlers.checks,
	'favicon.ico': handlers.favicon,
	'public': handlers.public
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

