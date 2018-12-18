var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var socketsOn = [];




//ONLY FOR SECURITY
//npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

io.on('connection', function(socket) {
	//include socket on JobId
	var newjoin = socket.handshake.query.Token;
	socket.join(newjoin);
	//socketsOn.push({user: socket.handshake.query.Login, socket: socket});
	var user = socket.handshake.query.Login;
	socketsOn[user] = socket;

	  console.clear();
	  console.log(Object.keys(io.sockets.adapter.rooms));
	  console.log(Object.keys(socketsOn));

    socket.on('disconnect', function() {

      socketsOn.splice(socketsOn.indexOf(socket), 1);

	  console.clear();
	  console.log(Object.keys(io.sockets.adapter.rooms));
	  console.log(Object.keys(socketsOn));
	      
	});

	socket.on('Package', ($data)=>{
		if ($data.event == 'direct') {

			var cli = $data.to;
				socketsOn[cli].emit('Package', $data);

		} else {
	
			io.to(newjoin).emit('Package', $data);
			
		}

	});
});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});
