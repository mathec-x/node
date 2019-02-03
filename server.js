var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5000;
var socketsOn = [];
var connections = [];


//ONLY FOR SECURITY
//npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

io.on('connection', function(socket) {
	//include socket on JobId
	var newjoin = socket.handshake.query.Token;
	// join into new group
	socket.join(newjoin);
	//catch user login on the querystring
	var user = socket.handshake.query.Login;
	//verify if user is present
	if (socketsOn[user]) {
		console.log('Duplicate user '+ user);
		socketsOn[user].emit('Package', {io: 'Duplicate', user: user});
		socketsOn.splice(socketsOn[user], 0);
	}
	//store user by login and self sokcet id
		socketsOn[user] = socket;
		    // console.clear(); console.log('Rooms =>'+Object.keys(io.sockets.adapter.rooms));
			connections = Object.keys(socketsOn)

			    // emit user when new connection
				io.to(newjoin).emit('Package', {io: 'New', user: user, online: connections});
				console.clear();console.log(connections);
				//console.log(user +' Conectou');
	
    // emit disconect client
    socket.on('disconnect', function() {
	    delete socketsOn[user];
			connections = Object.keys(socketsOn);
			    // emit users when new disconnetcion
				//console.clear();console.log(connections);
				console.log(user +' desconectou');
		   				 io.to(newjoin).emit('Package', {io: 'Disconnect', user: user});	      
	});

    // chamada a cada interação da tela
	socket.on('Package', ($data)=>{
		if ($data.direct) {
			// se existir um atributo direct
			var cli = socketsOn[$data.direct];
			    cli.emit('Package', $data);
				    console.log('direct to ' + cli);

		} else {	
			// se não envia para todos
			io.to(newjoin).emit('Package', $data);
				console.log(user +' Enviou a todos');
		}

	});
});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});
