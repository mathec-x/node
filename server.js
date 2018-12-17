var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var ConnUsers = [];

//ONLY FOR SECURITY
//npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

var totalUsers = 0;

io.on('connection', function(socket) {
	//include socket on JobId
	var newjoin = socket.handshake.query.Token;
	socket.join(newjoin);

	function showusers(){
		console.clear();
		var socketsOn = [];
		 for (var i = ConnUsers.length - 1; i >= 0; i--) {
		 	socketsOn.push(ConnUsers[i].handshake.query);
		 }
		   	 return socketsOn;
	}


	ConnUsers.push(socket);	
	console.log(showusers());
	totalUsers++;

    socket.on('disconnect', function() {
		  totalUsers--;
	      ConnUsers.splice(ConnUsers.indexOf(socket), 1);
	      console.log(showusers());
	});

	socket.on('Package', (newpackage)=>{
		io.to(newjoin).emit('Package', newpackage);

	});
});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});

