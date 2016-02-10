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
			});// end socket.on connect			
		},
		getClients:function() {
			
			socket.emit('getClients');
		},
		
		updateClientConsoleUI:function(clients) {
			var i=0;
			var content='';
			if (clients.length==0) {
				content+='<tr><td colspan=\'3\'>No clients connected</td></tr>';
			}
			for (i=0; i<clients.length;i++) {
				content+='<tr>';
				content+='<td id=\'cnt_'+clients[i].id+'\' >';
				content+=(i+1);
				content+='<td id=\'client_'+clients[i].id+'\' >';
				content+=clients[i].id;
				content+='</td>';
				content+='<td id=\'loc_'+clients[i].id+'\' >';
				content+='('+clients[i].position.lat+','+clients[i].position.lng+')';
				content+='</td>';
				
				content+='</tr>';
			}
			$('#clientBody').html(content);
		},
		updateClientConsoleLocation:function(data) {
			console.log('update location! '+data.clientId);
			var el=$('#loc_'+data.clientId);
			el.html('('+data.position.lat+', '+data.position.lng+')');
		}		
};