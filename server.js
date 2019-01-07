var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5000;
var socketsOn = [];




//ONLY FOR SECURITY
//npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

io.on('connection', function(socket) {
	//include socket on JobId
	var newjoin = socket.handshake.query.Token;
	socket.join(newjoin);

	var user = socket.handshake.query.Login;
	socketsOn.push({user: user, socket: socket});


	  console.clear();
	  console.log('Rooms =>'+Object.keys(io.sockets.adapter.rooms));
	  for (var i = socketsOn.length - 1; i >= 0; i--) {
		  console.log(socketsOn[i].user);
	  }

    socket.on('disconnect', function() {

      socketsOn.splice(socket, 1);

	  console.clear();
	  console.log('Rooms =>'+Object.keys(io.sockets.adapter.rooms));
	  for (var i = socketsOn.length - 1; i >= 0; i--) {
		  console.log(socketsOn[i].user);
	  }
	      
	});

	socket.on('Package', ($data)=>{
		if ($data.direct) {
	
			  for (var i = socketsOn.length - 1; i >= 0; i--) {
				  if (socketsOn[i].user == $data.direct) {				  	
					console.log(user +' Enviou para: ' + $data.direct);
					var cli = socketsOn[i].socket;

						 cli.emit('Package', $data);
			
					break;
				  } else {

				  	 console.log(user +' Enviou para: ' + $data.direct + ' usuário estava deslogado');

				  }
			  }

		} else {	
		
			io.to(newjoin).emit('Package', $data);
			console.log(user +' Enviou a todos');
		}

	});
});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});
