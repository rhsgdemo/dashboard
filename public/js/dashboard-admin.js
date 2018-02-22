DashboardAdmin={
		connect:function() {
			console.log('admin connecting to server...');
			socket=io();
			socket.on('connect', function(){
				console.log('connected to server as admin:  socket id: '+socket.id);
				socket.emit('getClients');

				socket.on('sendClients', function(data){
					console.log('number of clients: '+data.length);
					//update UI
					DashboardAdmin.updateClientConsoleUI(data);
				});

				socket.on('updateClients',function(data){
					console.log('updated clients info coming in...'+data.length);
					//update UI
					DashboardAdmin.updateClientConsoleUI(data);
				});
				socket.on('updateClientLocation',function(data){
					console.log('updated clients location ...'+data.clientId);
					//update UI
					DashboardAdmin.updateClientConsoleLocation(data);
				});
				socket.on('liveImage',function(data){
					console.log(Object.keys(data));
					console.log('incoming image from ...'+data.clientId);
					//update UI
					var el=$('#status_'+data.clientId);
					var clientImg=new Object();
					console.log('=='+data.file.name);
					console.log('=='+data.file.runningNum);
					clientImg.fileName=data.file.name;
					clientImg.runningNum=data.file.runningNum;
					clientImg.position=data.file.position;
					clientImg.clientId=data.clientId;
					clientImg.refName=data.clientId+'_'+clientImg.runningNum;
					clientImages.push(clientImg);
					el.html('Captured Image@('+clientImg.position.lat+','+clientImg.position.lng+')');
					DashboardAdmin.blink(el);
					liveImageInfoWindow = new google.maps.InfoWindow({
						map: map,
						position: data.file.position,
						content:'<div><b>Photo Taken by '+clientImg.clientId+'</b></div>',
						maxWidth:250
					});
					var bytes = new Uint8Array(data.file.data);
					//$('#infoImg').attr('src',DashboardAdmin.encodeBytes(bytes));
					//document.getElementById('infoImg').src=DashboardAdmin.encodeBytes(bytes);
					var content=liveImageInfoWindow.getContent()+"<div><img id=\'img_"+clientImg.refName+"\' src=\'"+DashboardAdmin.encodeBytes(bytes)+"\' style=\'height:50px;width:75px;\'/></div>";
					content+="<div id=\'"+clientImg.refName+"\'  class=\'sendInfoImg\'  style=\'cursor:pointer\;text-decoration:underline;'>Broadcast photo</div>";
					liveImageInfoWindow.setContent(content);
					google.maps.event.addListener(liveImageInfoWindow, 'domready', function() {
					      // whatever you want to do once the DOM is ready
						$('#'+clientImg.refName).on('click',function(event){
							console.log(event.target.id+ ' clicked ' );
							socket.emit('broadcastPhoto',{clientId:clientImg.clientId, fileName:clientImg.refName+'_photo.png',position:clientImg.position});
						});
						if (liveImageInfoWindows[data.clientId]) {
							liveImageInfoWindows[data.clientId].close()
						}
						liveImageInfoWindows[data.clientId]=liveImageInfoWindow;
					});

				});
				socket.on('msg',function(data){
					//alert(data.from+' '+data.msg);
					msgInfoWindow = new google.maps.InfoWindow({
						map: map,
						position: data.pos,
						content:'<div><b>Message from '+data.from+':</b><div>'+data.msg+'</div></div>',
						maxWidth:250
					});
					if (msgInfoWindows[data.from]) {
						msgInfoWindows[data.from].close()
					}
					msgInfoWindows[data.from]=msgInfoWindow;
				});

			});// end socket.on connect
		},
		getClients:function() {

			socket.emit('getClients');
		},

		updateClientConsoleUI:function(clients) {
			localClients=clients;
			//clear all markers
			var i=0;
			for (i=0;i < clientMarkers.length;i++) {
				clientMarkers[i].setMap(null);
			}
			i=0;
			for (i=0;i < photoMarkers.length;i++) {
				photoMarkers[i].setMap(null);
			}
			var content='';
			if (localClients.length==0) {
				content+='<tr><td colspan=\'3\'>No clients connected</td></tr>';
			}
			for (i=0; i<localClients.length;i++) {
				content+='<tr>';
				content+='<td id=\'cnt_'+localClients[i].id+'\' >';
				content+=(i+1);
				content+='<td id=\'client_'+localClients[i].id+'\' >';
				content+=localClients[i].id;
				content+='</td>';
				content+='<td class=\'locationTd\'  id=\'loc_'+localClients[i].id+'\' style=\'cursor:pointer;text-decoration:underline;\'>';
				content+='('+localClients[i].position.lat+','+localClients[i].position.lng+')';
				content+='</td>';
				content+='<td id=\'status_'+localClients[i].id+'\' >';
				content+='('+localClients[i].status+')';
				content+='</td>';

				content+='</tr>';
				//create marker

				var clientMarker = new google.maps.Marker({
			    	position:localClients[i].position,
			    	map: map,
			    	draggable:false,
			    	title: localClients[i].id
				});
				clientMarkers.push(clientMarker);
				localClients[i].marker=clientMarker;
			}
			$('#clientBody').html(content);
			$('.locationTd').on('click',function(event) {
				console.log('clicked '+event.target.id);
				var cid=event.target.id.substring(4);
				console.log('clientId '+cid);
				var i=0;
				for (i=0;i < localClients.length;i++) {
					if (localClients[i].id==cid) {
						map.setCenter(localClients[i].marker.position);
					}
				}
			});

		},
		updateClientConsoleLocation:function(data) {
			console.log('update location! '+data.clientId);
			var el=$('#loc_'+data.clientId);
			el.html('('+data.position.lat+', '+data.position.lng+')');
			DashboardAdmin.blink(el);
			$('#status_'+data.clientId).html('(ok)');
			var i=0;
			for (i=0;i<localClients.length;i++) {
				if (localClients[i].id==data.clientId) {
					localClients[i].marker.setPosition(data.position);
				}
			}

			//assumed location updated, clear old message infoWindow
			msgInfoWindows[data.clientId].close();
			liveImageInfoWindows[data.clientId].close();
		},

		blink:function(ele) {
			setTimeout(function(){
		        ele.toggleClass("backgroundBlink");
		     },400)
			setTimeout(function(){
		        ele.removeClass("backgroundBlink");
		     },800)
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
  //infoWindow = new google.maps.InfoWindow({map: map});

}
//Try HTML5 geolocation.
if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
	  	currentPos = {
	    		lat: position.coords.latitude,
	    		lng: position.coords.longitude
	  	};

	    //infoWindow.setPosition(currentPos);
	    //infoWindow.setContent('You are here.');
		map.setCenter(currentPos);
/*		marker = new google.maps.Marker({
	    	position:currentPos,
	    	map: map,
	    	draggable:true,
	    	title: 'Hello World!'
		});
*/
		//marker.setMap(map);
		map.addListener('click', function(event) {
		});
	}, function() {
	handleLocationError(true, infoWindow, map.getCenter());
	});
} else {
		// Browser doesn't support Geolocation
		handleLocationError(false, infoWindow, map.getCenter());
}
