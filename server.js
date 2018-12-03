var app= require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);
var port = 3000;
//process.env.PORT ||

// app.get('/', (req,res)=>{
// 	console.log(__dirname);
// 	res.sendFile(__dirname+'/realtime/index.php');
// })
var totalUsers = 0;

io.on('connection', function(socket) {
	totalUsers++;
	console.log(totalUsers);
	
//	console.log(socket.id);     
	 socket.on('Pack', (newpackage)=>{
//	  	socket.broadcast.emit('Pack', newpackage);
		io.emit('Pack', newpackage);

	  });

	 socket.on('NewMessage', (message)=>{
		io.emit('NewMessage', message);
	  });

	 socket.on('KreatorPush', (newitems)=>{
	 	console.log(newitems);
		io.emit('KreatorPush', newitems);
	  });
});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});

