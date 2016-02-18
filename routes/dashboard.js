/**
 * http://usejsdoc.org/
 */
exports.test = function(req, res) {
	console.log('test');
	console.log(req.body);
	console.log(req.body.test1);
	console.log(req.body.test2);
	res.send('test');

}

exports.testmedia = function(req, res) {
	// res.render('index', { title: 'Express' });
	res.sendfile("views/test.html");
};
exports.testclient = function(req, res) {
	// res.render('index', { title: 'Express' });
	res.sendfile("views/test1.html");
};

exports.client = function(req, res) {
	// console.log(req.body);

	var clientId = req.query.cid;
	console.log('client id :' + clientId);

	res.sendfile("views/client.html");

}

// curl -X POST -d '{"test1":123}' -H "Content-Type: application/json"
// http://localhost:3000/dashboard
// curl -X POST -d '{"test1":123, "test2":"test2"}' -H "Content-Type:
// application/json" http://localhost:3000/dashboard
// **********************Non Test routes**************
exports.dashboardclient = function(req, res) {
	// res.render('index', { title: 'Express' });
	res.sendfile("views/dashboard-client.html");
};
exports.dashboardadmin = function(req, res) {
	// res.render('index', { title: 'Express' });
	res.sendfile("views/dashboard-admin.html");
};

var http = require('http');
var cacheName = 'demoCache' || process.env[CACHE_NAME] ;
var DG_PUBLIC_HOST = 'dg.cloudapps.demo.com' //quick and dirty hack
		|| process.env[APPLICATION_NAME + '_DG_SERVICE_HOST'];
var DG_PUBLIC_PORT = '80'
		|| process.env[APPLICATION_NAME + '_DG_SERVICE_PORT'];
var jdgOptions = {
	// host: DG_SERVICE_HOST,
	host : DG_PUBLIC_HOST,
	// path: "/rest/teams/test",
	path : "/rest/demoCache/test",
	method : "PUT",
	port : DG_PUBLIC_PORT,
	data : "1234",
	headers : {
		'Content-type' : 'text/plain'
	}
};


exports.jdgList = "";

exports.jdgHelper = {

	saveClient : function(client) {
		console.log('saving....' + client.id + ',(' + client.position.lng + ','
				+ client.position.lat + ')');
		console.log(JSON.stringify(client));
		jdgOptions.path = "/rest/" + cacheName + "/" + client.id;
		jdgOptions.method = 'PUT';
		jdgOptions.data = JSON.stringify(client);
		this.callRest(jdgOptions);

	},
	getClient : function(clientId, callback) {
		console.log('get....' + clientId);
		jdgOptions.path = "/rest/" + cacheName + "/" + clientId;
		jdgOptions.method = 'GET';
		this.callRest(jdgOptions,callback);
	},
	getClients : function(callback) {
		console.log('get....all');
		jdgOptions.path = "/rest/" + cacheName;
		jdgOptions.method = 'GET';
		this.callRest(jdgOptions,callback);
	},
	deleteClient : function(clientId) {
		console.log('delete....' + clientId);
		jdgOptions.path = "/rest/" + cacheName + "/" + clientId;
		jdgOptions.method = 'DELETE';
		this.callRest(jdgOptions);
	},

	callRest : function(options, callback) {
		console.log('-----------------------------------' + options.host);
		console.log('-----------------------------------' + options.port);
		console.log('-----------------------------------' + options.host);
		console.log('-----------------------------------' + options.method);

		var restReq = http.request(options, function(restResp) {
			console.log('STATUS: ' + restResp.statusCode);
			console.log('HEADERS: ' + JSON.stringify(restResp.headers));
			restResp.setEncoding('utf8');
			var output = '';
			var textChunk = '';
			restResp.on('data', function(chunk) {
				console.log('BODY: ' + chunk);
				output += chunk;
				textChunk += chunk.toString('utf8');
			});

			restResp.on('end', function() {
				console.log('No more data in response. ' + this.statusCode);
				if (this.statusCode == '200') {
					if (options.method == 'PUT') {
						console.log('Saved Successful');
					} else if (options.method == 'GET') {
						console.log('GET ' + output);
						//jdgList = textChunk;
						//console.log(jdgList);
						callback(textChunk);
					} else if (options.method == 'DELETE') {
						console.log('Deleted ');
					}
				}
			});
		});
		restReq.on('error', function(e) {
			console.log('problem with request: ' + e.message);
			res.send('there is a problem with this request: ' + e.message);
		});

		// write data to request body for PUT usecases
		if (options.method == 'PUT') {
			restReq.write(options.data);
		}
		restReq.end();
	},
	test : function(msg) {
		console.log('test :' + msg);
	}

}
