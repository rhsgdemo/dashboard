/**
 * http://usejsdoc.org/
 */
exports.test=function(req, res) {
	console.log('test');
	console.log(req.body);
	console.log(req.body.test1);
	console.log(req.body.test2);
	res.send('test');
	
	
}

exports.testmedia = function(req, res){
	 // res.render('index', { title: 'Express' });
		res.sendfile("views/test.html");
	};
exports.testclient = function(req, res){
	 // res.render('index', { title: 'Express' });
		res.sendfile("views/test1.html");
	};

exports.client=function(req, res) {
	//console.log(req.body);

	var clientId=req.query.cid;
	console.log('client id :'+clientId);
	
	res.sendfile("views/client.html");
	
}

//curl -X POST -d '{"test1":123}' -H "Content-Type: application/json" http://localhost:3000/dashboard
//curl -X POST -d '{"test1":123, "test2":"test2"}' -H "Content-Type: application/json" http://localhost:3000/dashboard
//**********************Non Test routes**************
exports.dashboardclient = function(req, res){
	 // res.render('index', { title: 'Express' });
		res.sendfile("views/dashboard-client.html");
};
exports.dashboardadmin = function(req, res){
	 // res.render('index', { title: 'Express' });
		res.sendfile("views/dashboard-admin.html");
};
