/*
*	Application handlers
*
*/

//Dependencies
let _data = require('./data');
let helpers = require('./helpers');

//Define the Handler
var handlers = {};

//Define Sample Handler
handlers.ping = function(data, callback) {
	//Callback a http Status Code and a payload object
	callback(200);
}

//Define Users Handler
handlers.users = function (data, callback) {
	let acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
}

// Define Tokens Handler
handlers.tokens = function (data, callback) {
	let acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
}

// Define sub handlers
handlers._users = {};

// Users POST
// required data: firstname, lastname, phone, password, tosAggrement
// optional data : none
handlers._users.post = function (data, callback) {
	let firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : '';
	let lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : '';
	let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : '';
	let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : '';
	let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if( firstname && lastname && phone && password && tosAgreement ) {
		_data.read('users', phone, function (err, fileData) {
			if( err ) {
				let hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					let postData = {
						firstname,
						lastname,
						phone,
						hashedPassword,
						tosAgreement
					}
					_data.create('users', phone, postData, function (err) {
						if(!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500, {'Error': 'Could not create the new user.'});
						}
					});
				} else {
					callback(400, {'Error': 'Unable to hash the password.'});
				}

			} else {
				callback(400, {'Error': 'A User with that phone number all ready exits.'});
			}
		});
	} else {
		callback(400, {'Error' : 'Required fields need to be filled.'});
	}

} 

// Users GET
// required data: none
// optional data : none
handlers._users.get = function (data, callback) {
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : '';
	if (phone) {
		// get the tokens from the headers
		let token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
		//verify that the given token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if(tokenIsValid) {
				//lookup the user
				_data.read('users', phone, function (err, data) {
					if(!err && data) {
						// Removed the hashed password from the data.
						delete data.hashedPassword;
						callback(200, data);
					} else {
						callback(404);
					}
				});
			} else {
				callback(403, {'Error': 'Missing required token in header, or token is not valid.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Users PUT
// required data: firstname or lastname or password
// optional data : none
handlers._users.put = function (data, callback) {
	//check for the required field
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : '';
	if( phone ) {
		// check for the optional fields
		let firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : '';
		let lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : '';
		let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : '';
		// Error if nothing is sent for update	
		if ( firstname || lastname || password ) {
			// get the tokens from the headers
			let token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
			//verify that the given token is valid for the phone number
			handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
				if(tokenIsValid) {
					//lookup for user
					_data.read('users', phone, function (err, userData) {
						if (!err && userData) {
							if (firstname) {
								userData.firstname = firstname;
							}
							if (lastname) {
								userData.lastname = lastname;
							}
							if (lastname) {
								userData.hashedPassword = helpers.hash(password);
							}
							// update the user
							_data.update('users', phone, userData, function (err) {
								if(!err) {
									callback(200);
								} else {
									console.log(err);
									callback(500, {'Error': 'Unable to update the user.'});
								}
							});
						} else {
							callback(400, {'Error': 'The specified user does not exists.'});
						}
					});
				} else {
					callback(403, {'Error': 'Missing required token in header, or token is not valid.'});
				}
			});
		} else {
			callback(400, {'Error': 'Missing fields to update.'});
		}
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Users DELETE
// required data: none
// optional data : none
handlers._users.delete = function (data, callback) {
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : '';
	if (phone) {
		// get the tokens from the headers
		let token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
		//verify that the given token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if(tokenIsValid) {
				//lookup the user
				_data.read('users', phone, function (err, data) {
					if(!err && data) {
						_data.delete('users', phone, function (err) {
							if (!err) {
								callback(200);
							} else {
								console.log(err);
								callback(500, {'Error' : 'Unable to delete the user.'})
							}
						});
					} else {
						callback(404, {'Error': 'The specified user does not exists to delete.'});
					}
				});
			} else {
				callback(403, {'Error': 'Missing required token in header, or token is not valid.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}


// Define sub handlers
handlers._tokens = {};

// verify if a given taken id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
	// lookup the token
	_data.read('tokens', id, function (err, tokenData) {
		if (!err && tokenData) {
			if(tokenData.phone == phone && tokenData.expires > Date.now()) {
				return callback(true);
			} else {
				return callback(false);
			}
		} else {
			return callback(false);
		}
	});
}

// Tokens POST
// required data: phone, password
// optional data : none
handlers._tokens.post = function (data, callback) {
	let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : '';
	let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : '';
	if ( phone && password) {
		//lookup for the user with the phone number
		_data.read('users', phone, function (err, userData) {
			if(!err && userData) {
				//hash the sent password and compare with the userData password
				let hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword) {
					// if valid create a token id with random name, set expiration date 1hour
					let tokenId = helpers.createRandomString(20);
					console.log(tokenId);
					let expires = Date.now() + 1000 * 60 * 60;
					let tokenObject = {
						phone,
						id : tokenId,
						expires
					}
					//store the token 
					_data.create('tokens', tokenId, tokenObject , function(err) {
						if(!err) {
							callback(200, tokenObject);
						} else {
							callback(500, {'Error': 'Unable to create the token.'});		
						}
					});
				} else {
					callback(400, {'Error': 'Password did not match the specified user\'s stored password.'});
				}
			} else {
				callback(400, {'Error': 'The specified user does exist with the given phone number.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Tokens GET
// required data: id
// optional data : none
handlers._tokens.get = function (data, callback) {
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : '';
	if (id) {
		//lookup the token
		_data.read('tokens', id, function (err, tokenData) {
			if(!err && tokenData) {
				callback(200, tokenData);
			} else {
				callback(404, {'Error': 'The specified token data does not exists.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Tokens PUT
// required data: id, extend
// optional data : none
handlers._tokens.put = function (data, callback) {
	let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : '';
	let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	if( id && extend ) {
		// lookup for the token
		_data.read('tokens', id, function (err, tokenData) {
			if( !err && tokenData) {
				// check to make sure that token is'nt already expires
				if(tokenData.expires > Date.now()) {
					// set the expiration hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60;
					// store the new update
					_data.update('tokens', id, tokenData, function (err) {
						if( !err) {
							callback(200);
						} else {
							callback(500, {'Error': 'Unable to extend the expiration time.'});
						}
					});

				} else {
					callback(400, {'Error': 'The token has already expired, and connot be extended.'});	
				}
			} else {
				callback(400, {'Error': 'Specified Token does not exists.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Tokens Delete
// required data: id, extend
// optional data : none
handlers._tokens.delete = function (data, callback) {
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : '';
	if (id) {
		//lookup the token
		_data.read('tokens', id, function (err, tokenData) {
			if(!err && tokenData) {
				_data.delete('tokens', id, function(err) {
					if(!err) {
						callback(200);
					} else {
						callback(500, {'Error': 'Could not delete the specified token.'});		
					}
				});
			} else {
				callback(404, {'Error': 'The specified token data does not exists.'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Define Not Found Handler
handlers.notFound = function(data, callback) {
	callback(404);
}

// export handlers
module.exports = handlers;