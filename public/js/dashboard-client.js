/**
 * http://usejsdoc.org/
 */

DashboardClient={
		
		connect: function() {
			if (btnConnectStatus==0) {
				console.log(' >> connect : '+$('#formClientId').val() );
				btnConnectStatus=1
				$('#btnConnect').html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Logout');
				clientId=$('#formClientId').val();
				$('#formClientId').val('Client: '+clientId);
				$('#statusLabel').html('Status : connected');
				$('#formClientId').attr('readonly','readonly');
				socket=io();
				// socket on connect
				socket.on('connect', function(){
					console.log('connected to server:  '+clientId+' socket id: '+socket.id);
					socket.emit('client',{id: clientId, position:currentPos});				
					socket.on('toClient',function(data){
						//$('#displayDiv').show();
						$('#statusLabel').html(data);
					});
				});// end socket.on connect
				// socket on reveiving message
				socket.on('msg',function(data){
					console.log('incoming message');
					$('#displayDiv').show();
					var m=$('#displayDiv').html()+'<br/><b>message from '+data.from+': ['+data.msg+']</b>';
					$('#displayDiv').html(m);
				});				
				//socket on receiving incoming image (delivery does not work for client)
				socket.on('image',function(data){
					console.log('incoming image');
					//alert(data.buffer);
					var bytes = new Uint8Array(data.buffer);
					$('#localImg').width('100%');
					$('#localImg').height(350);
					 $('#localImg').attr('src', DashboardClient.encodeBytes(bytes));
					 $('#displayDiv').html('Received image from server '+data.position.lat+', '+data.position.lng );
				});				
				//************setting up delivery object******************
				delivery=new Delivery(socket);
				delivery.on('delivery.connect',function(delivery){
					console.log('delivery connected');
				});				
			    delivery.on('send.success',function(fileUID){
			        console.log("file was successfully sent.");
			        $('#displayDiv').html('file sent');
			     });
			    
			    
			} else {
				console.log(' >> disconnect : '+$('#formClientId').val() );
				$('#btnConnect').html('Login');
				btnConnectStatus=0;
				$('#formClientId').val('');
				$('#formClientId').attr('readonly',false);
				$('#statusLabel').html('Status : disconnected');
				socket.emit('disconnectClient', clientId);
			}
		},
		sendMsg:function() {
			if (socket==null) {
				//socket = io.connect('http://192.168.223.130:3000');
				socket=io();
			} else {
				console.log('sending message');
				socket.emit('msg',{from: clientId, msg:$('#formMsg').val()});
				$('#displayDiv').html('message sent');
			}		
		},
		sendFile: function()  {
			if (socket==null) {
//				socket = io.connect('http://192.168.223.130:3000');
				socket=io();
				delivery=new Delivery(socket);
			} else {
				console.log('sending file @'+currentPos.lat+ ' ,'+currentPos.lng);
				var params={currentPos:currentPos};
				delivery.send(file,params);
				//socket.emit('msg',{from: clientId, msg:$('#formMsg').val()});
			}		
		},
		updateClientLocation:function(currentPos) {
			console.log('client update location');
			if (socket==null) {
				socket=io();
			} else
    		socket.emit('updateClientLocation',{clientId:clientId, position:currentPos});
		},
		
		handleVideo:function(stream) {
			console.log('handleVideo');
			var v=$('#v');
			var b=$('#b');
			var sc=$('#stopCam');
			var sendPhotoBtn=$('#sendPhoto');
			var c=document.getElementById('c');
			var video=document.getElementById('v');
			var i=$('#localImg');
			var snap=window.URL.createObjectURL(stream);
		    v.attr('src', snap);
			//button.disabled = false;
			b.on('click', function() {
				console.log('picture clicked');
				//c.getContext("2d").drawImage(video, 0, 0, 200, 200, 0, 0, 200, 200);
				c.getContext("2d").drawImage(video, 0, 0, 150,100);
				var img = c.toDataURL("image/png");
				$('#displayDiv').html('Photo Taken, click send to upload:');
				i.attr('src',img);
			});    			
			sc.on('click', function() {
				console.log('stop cam '+Object.keys(stream));
				video.pause();
				video.src="";
				stream.getTracks()[0].stop();
			});
			
			sendPhotoBtn.on('click', function() {
				console.log('send photo');
				var data= DashboardClient.dataURItoBlob(c.toDataURL("image/png"));
				if (socket==null) {
					socket=io();
				} else {
					socket.emit('liveImage',{clientId:clientId, name:clientId+'_photo.png',data:data, position:currentPos});
					$('#displayDiv').html('Photo uploaded');
					i.attr('src','');

				}
			});
			
			
		},
		videoError:function(e) {
			console.log('error '+e);
		},
		dataURItoBlob:function(dataURI) {
		    // convert base64/URLEncoded data component to raw binary data held in a string
		    var byteString;
		    if (dataURI.split(',')[0].indexOf('base64') >= 0)
		        byteString = atob(dataURI.split(',')[1]);
		    else
		        byteString = unescape(dataURI.split(',')[1]);

		    // separate out the mime component
		    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		    // write the bytes of the string to a typed array
		    var ia = new Uint8Array(byteString.length);
		    for (var i = 0; i < byteString.length; i++) {
		        ia[i] = byteString.charCodeAt(i);
		    }

		    return new Blob([ia], {type:mimeString});			
		},
		encodeBytes: function (input)  {
		    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		    var output = "";
		    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		    var i = 0;

		    while (i < input.length) {
		        chr1 = input[i++];
		        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
		        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

		        enc1 = chr1 >> 2;
		        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		        enc4 = chr3 & 63;

		        if (isNaN(chr2)) {
		            enc3 = enc4 = 64;
		        } else if (isNaN(chr3)) {
		            enc4 = 64;
		        }
		        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
		                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
		    }
		    return "data:image/jpg;base64,"+output;
		}
};


function initMap() {
	  map = new google.maps.Map(document.getElementById('map'), {
	    center: {lat: -34.397, lng: 150.644},
	    zoom: 15
	  });
    infoWindow = new google.maps.InfoWindow({map: map});
		  
}
// Try HTML5 geolocation.
if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
    	currentPos = {
      		lat: position.coords.latitude,
      		lng: position.coords.longitude
    	};

	    infoWindow.setPosition(currentPos);
	    infoWindow.setContent('You are here.');
		map.setCenter(currentPos);
		marker = new google.maps.Marker({
	    	position:currentPos,
	    	map: map,
	    	draggable:true,
	    	title: 'Hello World!'
  		});
		marker.setMap(map);			      
 		map.addListener('click', function(event) {
	  		console.log('clicked on map '+event.latLng);
	    	//map.setZoom(8);
	    	marker.setPosition(event.latLng);
	    	//map.setCenter(marker.getPosition());
	    	map.panTo(marker.getPosition());
	    	currentPos=marker.getPosition();
	    	DashboardClient.updateClientLocation(currentPos);
		});			  
	}, function() {
	handleLocationError(true, infoWindow, map.getCenter());
	});
} else {
		// Browser doesn't support Geolocation
		handleLocationError(false, infoWindow, map.getCenter());
}		  
