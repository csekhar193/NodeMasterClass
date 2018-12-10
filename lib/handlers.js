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
		console.log(data.method);
		handlers._users[data.method](data, callback);
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
// @TODO: allow only logged in users to fetch the data.
handlers._users.get = function (data, callback) {
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : '';
	if (phone) {
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
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Users PUT
// required data: firstname or lastname or password
// optional data : none
// @TODO: allow only logged in users to fetch the data.
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
			callback(400, {'Error': 'Missing fields to update.'});
		}
	} else {
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Users DELETE
// required data: none
// optional data : none
// @TODO: allow only logged in users to fetch the data.
handlers._users.delete = function (data, callback) {
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : '';
	if (phone) {
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
		callback(400, {'Error': 'Missing Required fields.'});
	}
}

// Define Not Found Handler
handlers.notFound = function(data, callback) {
	callback(404);
}

// export handlers
module.exports = handlers;