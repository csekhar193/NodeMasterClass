/*
*	Application handlers
*
*/

//Dependencies
let _data = require('./data');
let helpers = require('./helpers');
let config = require('./config');

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

// Define Tokens Handler
handlers.checks = function (data, callback) {
	let acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
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
				_data.read('users', phone, function (err, userData) {
					if(!err && data) {
						_data.delete('users', phone, function (err) {
							if (!err) {
								let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks : []; 
								let checksToDelete = userChecks.length;
								if(checksToDelete > 0) {
									let checksDeleted = 0;
									let deletionErrors = false;
									userChecks.forEach((checkId) => {
										//Delete the check
										_data.delete('checks',checkId, function (err) {
											if(err) {
												deletionErrors = true;
											} 
											checksDeleted++;
											if(checksDeleted == checksToDelete) {
												if(!deletionErrors) {
													callback(200);
												} else {
													callback(500, {"Error" : 'Errors encountered while attempting to delete the user checks.'})
												}
											}
										});
									})
								} else {
									callback(200);	
								}
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


// Define checks sub handlers
handlers._checks = {};

// Checks POST
// required data: protocol, url, method, successCodes, timeoutSecounds  
// optional data : none
handlers._checks.post = function (data, callback) {
	//validate inputs
	let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;  
	let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' ? data.payload.timeoutSeconds : false;
	if( protocol && url && method && successCodes && timeoutSeconds ) {
		let token = typeof(data.headers.token) == 'string' ? data.headers.token : '';
		if (token) { 
			//lookup the token
		_data.read('tokens', token, function (err, tokenData) { 
			if (!err && tokenData) {
				let userPhone = tokenData.phone;
				// lookup the user data
				_data.read('users', userPhone, function (err, userData) {
					if(!err && userData) {
						let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks : []; 
						// verify that the user has less than the number of max-checks-per-user
						if(userChecks.length < config.maxChecks) {
							// create a random id for check
							let checkId = helpers.createRandomString(20);
							// create a check object
							let checkObject = {
								id : checkId,
								userPhone, 
								protocol,
								url,
								method,
								successCodes,
								timeoutSeconds
							}
							// save the check object
							_data.create('checks', checkId, checkObject, function (err) {
								if(!err) {
									userData.checks = userChecks;
									userData.checks.push(checkId);
									// update the check in Checks array of userData
									_data.update('users', userPhone, userData, function(err) {
										if(!err) {	
											callback(200, checkObject);
										} else {
											callback(500, {'Error': 'Unable to update new check for the user.'});		
										}
									});
								} else {
									callback(500, {'Error': 'Unable to create a new check for the user.'});			
								}
							});

						} else {
							callback(403, {'Error': 'User already has max checks.'});	
						}
					} else {
						callback(403, {'Error': 'Unable to read the user data.'});
					}
				});
			} else {
				callback(403, {'Error': 'Unable to read the token data.'});	
			}
		});
		} else {
			callback(400, {'Error': 'Missing headers token.'});	
		}
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Checks GET
// required data: id, tokenid  
// optional data : none
handlers._checks.get = function (data, callback) {
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// validate the check id exists or not
		_data.read('checks', id, function (err, checkData) {
			if(!err && checkData) {
				let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// validate the token and it belongs to the user or not 
				handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
					if(isValidToken) {
						// send the check data
						callback(200, checkData);
					} else {
						callback(403, {'Error': 'Token may not exists or the token may already expired.'});			
					}
				}); 	
			} else {
				callback(400, {'Error': 'Unable to read the checks data.'});	
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required fields.'});	
	}
}

// Checks PUT
// required data: id, tokenid  
// optional data : protocol, url, method, successCodes, timeoutSecounds (any one of them)
handlers._checks.put = function (data, callback) {
	//validate inputs
	let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;  
	let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' ? data.payload.timeoutSeconds : false;
	if( protocol || url || method || successCodes || timeoutSeconds ) {
		let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
		if(id) {
			// validate the check id exists or not
			_data.read('checks', id, function (err, checkData) {
				if(!err && checkData) {
					let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
					// validate the token and it belongs to the user or not 
					handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
						if(isValidToken) {
							if(protocol) {
								checkData.protocol = protocol;
							}
							if(url) {
								checkData.url = url;
							}
							if(method) {
								checkData.method = method;
							}
							if(successCodes) {
								checkData.successCodes = successCodes;
							}
							if(timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}
							// update the check data
							_data.update('checks', id, checkData, function (err) {
								if(!err) {
									callback(200, checkData);
								} else {
									callback(500, {'Error': 'Unable to update the checks'})
								}
							});
						} else {
							callback(403, {'Error': 'Token may not exists or the token may already expired.'});			
						}
					}); 	
				} else {
					callback(400, {'Error': 'Unable to read the checks data.'});	
				}
			});
		} else {
			callback(400, {'Error': 'Missing check id fields.'});	
		}
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}


// Checks DELETE
// required data: id, tokenid  
// optional data : none
handlers._checks.delete = function (data, callback) {
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// validate the check id exists or not
		_data.read('checks', id, function (err, checkData) {
			if(!err && checkData) {
				let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// validate the token and it belongs to the user or not 
				handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
					if(isValidToken) {
						// Remove the specified check
						_data.delete('checks', id, function (err) {
							if (!err) {
								// remove the specified check in checks array of user data
								_data.read('users', checkData.userPhone, function (err, userData) {
									if(!err && userData) {
										let index = userData.checks.indexOf(id);
										if(index > -1) {
											userData.checks.splice(index, 1);
											// update the userData
											_data.update('users', checkData.userPhone, userData, function (err) {
												if (!err) {
													callback(200);
												} else {
													callback(500, {'Error': 'Unable to update the user data with updated checks.'});
												}	
											});
										} else {
											callback(500, {'Error': 'Could not find the check in the user data checks.'});
										}
									} else {
										callback(500, {'Error': 'Unable to read the user data.'})
									}
								});
							} else {
								callback(500, {'Error': 'Unable to delete the specified check'});
							}
						});
					} else {
						callback(403, {'Error': 'Token may not exists or the token may already expired.'});			
					}
				}); 	
			} else {
				callback(400, {'Error': 'Unable to read the checks data.'});	
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