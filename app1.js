
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
var clients=new Array();
var thisClient='';
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
io.on('connection', function(socket){
	console.log('connected by client');
	var delivery=dl.listen(socket);
	
	  delivery.on('delivery.connect',function(delivery){
		  	console.log('delivery.connect');
	  });


	  
	  delivery.on('receive.start',function(fileUID){
	        console.log('receiving a file! '+fileUID);
	      });
	  delivery.on('receive.success',function(file){
		    var params = file.params;
		    fs.writeFile(saveFilePath+'/'+file.name,file.buffer, function(err){
		      if(err){
		        console.log('File could not be saved.');
		      }else{
		        console.log('File saved.');
		      };
		    });		    
		  });
	  

	  fs.readFile('/tmp/ose31.png',function(err, buf){
		  socket.emit('image',{image:true,buffer:buf});
	  });
	  
	socket.on('client', function(data){
		console.log('client :'+data.id+'  '+socket.id);
		client=new Object();
		client.id=data.id;
//		client.socket=socket;
		client.socket=socket.id;
		clients.push(client);
		console.log(clients.length+ '  clients connected');
		for (var i =0; i<clients.length;i++) {
			console.log('current clients: '+clients[i].id+ ' '+clients[i].socket);
			socket.emit('toClient','Status : Connected');
		}
		
	});
	socket.on('msg', function(data){
		console.log('msg received from '+data.from+' '+data.msg);
		socket.broadcast.emit('msg',data );
		//socket.emit('msg',data );
	});
	
	socket.on('pingTest', function(data){
		console.log('ping received from '+data.clientId+' '+data.socketId);
	});
    socket.on('disconnect', function(){
        console.log('client disconnected '+thisClient);
        clients.pop('thisClient');
		console.log(clients.length+ '  clients connected');
      });	
});//io.on

