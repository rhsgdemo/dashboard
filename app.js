
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , dashboard=require('./routes/dashboard')
  , path = require('path')
  , app = express()
  , fs = require('fs')
  , http = require('http').Server(app)
  , dl = require('delivery')
  , io = require('socket.io')(http);
var options = {
		  key: fs.readFileSync('./key.pem'),
		  cert: fs.readFileSync('./cert.pem')
		};

var https=require('https').createServer(options,app);
io=require('socket.io')(https);
// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', routes.index);
app.get('/testmedia',dashboard.testmedia);
app.get('/testclient',dashboard.testclient);
//app.get('/users', user.list);
app.get('/dashboard', dashboard.test);
app.post('/dashboard', dashboard.test);
app.get('/client', dashboard.client);

//non testing routes
app.get("/dashboard-client",dashboard.dashboardclient);
app.get("/dashboard-admin",dashboard.dashboardadmin);

/*var server=http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
*/
/*
http.listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
});
*/
https.listen(8443, function(){
	  console.log('Express server listening on port 8443');
});

//*****************************socket.io*******************************
var client=null;
var saveFilePath='/tmp';
var clients=new Array();
var thisClient='';
var currentPos;
var runningNum=0;
io.on('connection', function(socket){
	console.log(' >> connected by client ');

	//on connect from client
	socket.on('client', function(data){
		console.log(' >> client :'+data.id+'  '+socket.id);
		client=new Object();
		client.id=data.id;
		//client.socketObj=socket;
		client.socket=socket.id;
		client.position=data.position;
		client.status='ok';
		clients.push(client);
		console.log(clients.length+ '  clients connected');
		for (var i =0; i<clients.length;i++) {
			console.log('current clients: '+clients[i].id+ ' '+clients[i].socket+ '@'+clients[i].position);
			//console.log('current clients: '+clients[i].id+ ' '+Object.keys(clients[i].socketObj));
			socket.emit('toClient','Status : Connected');
			//check for duplicated Id
			//TODO
		}
		socket.broadcast.emit('updateClients',clients);
	});// end on connect from client	
	
	//on socket disconnect from client
	socket.on('disconnectClient',function(data){
		console.log('>>>>>>>>>>>disconnecting...'+data);
/*		for (var i =0; i<clients.length;i++) {
			if (clients[i].id==data) {
				console.log('found client....popping it '+clients[i].id+':'+clients[i].socket);
				clients.pop(client[i]);
				break;
			}
		}*/		
		socket.disconnect();
		socket.broadcast.emit('updateClients',clients);
	});

	//on un expected socket disconnect from client
	socket.on('disconnect',function(data){

		console.log('=================unexpected disconnect '+socket.id);
		//do a check for all active sockets??
		for (var i =0; i<clients.length;i++) {
			if (clients[i].socket==socket.id) {
				console.log('found client....popping it '+clients[i].id+':'+clients[i].socket);
				clients.pop(client[i]);
				break;
			}
		}	
		socket.broadcast.emit('updateClients',clients);		
	});	
	//on receiving message from client
	socket.on('msg', function(data){
		console.log('msg received from '+data.from+' '+data.msg);
		socket.broadcast.emit('msg',data );
		//socket.emit('msg',data );
	});	
	
	//get number of clients
	socket.on('getClients',function(data) {
		console.log('returning number of clients');
		socket.emit('sendClients', clients);
	});
	
	//on update of client location
	socket.on('updateClientLocation',function(data){
		//clientid and position
		socket.broadcast.emit('updateClientLocation', data);
	});

	//on recevie of photo
	socket.on('liveImage',function(file){
		console.log('received live image');		
		//clientid and position
		file.runningNum=runningNum;
		file.name=file.clientId+'_'+(runningNum++)+'_photo.png';
		fs.writeFile(saveFilePath+'/'+file.name,file.data, function(err){
			if(err){
				console.log('File could not be saved.');
			} else{
				console.log('File saved.');
				//as a test, i resend the image back, remove in actual deployment
				//  fs.readFile('/tmp/'+file.name,function(err, buf){
					//  socket.emit('image',{image:true,buffer:buf, position:file.position});
				  //});	
				
				//inform admin console
				//from client: socket.emit('liveImage',{clientId:clientId, name:clientId+'_photo.png',data:data, position:currentPos});
				socket.broadcast.emit('liveImage',{clientId: file.clientId,file:file});
			};
	    });	// end file save			
	});
	//broadcast photo 
	socket.on('broadcastPhoto',function(data){
		console.log('broadcast photo!');
		fs.readFile(saveFilePath+'/'+data.fileName,function(err, buf){
					//  socket.emit('image',{image:true,buffer:buf, position:file.position});
				  //});	
				
				//inform admin console
				//from client: socket.emit('liveImage',{clientId:clientId, name:clientId+'_photo.png',data:data, position:currentPos});
				socket.broadcast.emit('image',{image:true,buffer:buf, position:data.position});
		});		
	});	
	//*****************delivery object setup******************
	var delivery=dl.listen(socket);
	delivery.on('delivery.connect',function(delivery){
		  	console.log('delivery.connect');
	}); //end delivery on connect	
	  
	delivery.on('receive.start',function(fileUID){
		console.log('receiving a file! '+fileUID);
	}); //end delivery receive start
	delivery.on('receive.success',function(file){
		var params = file.params;
		currentPos=params.currentPos;
		fs.writeFile(saveFilePath+'/'+file.name,file.buffer, function(err){
			if(err){
				console.log('File could not be saved.');
			} else{
				console.log('File saved.');
				//as a test, i resend the image back, remove in actual deployment
				  //fs.readFile('/tmp/'+file.name,function(err, buf){
					 // socket.emit('image',{image:true,buffer:buf, position:currentPos});
				  //});				
			};
	    });	// end file save	    
	}); //end delivery receive success	  
});//io.on

