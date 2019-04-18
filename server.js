var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5000;
var nodemailer = require('nodemailer');
var socketsOn = [];
var connections = [];
//ONLY FOR SECURITY //npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

io.on('connection', function(socket) {
	console.clear();
	if (socket.handshake.query.Host) {
		var host = socket.handshake.query.Host;
		var transporter = nodemailer.createTransport({
			  host: 'mail.'+host,
			  port: '587',
			  secure: false,
			  auth: {
			    user: 'noreply@'+host,
			    pass: socket.handshake.query.Hash
			  },
			  tls: { rejectUnauthorized: false }
			});
	}

	if (socket.handshake.query.Syb) {
		var subGroup = socket.handshake.query.Syb;		
			socket.join(subGroup);
	}


	//include socket on JobId
	var mainGroup = socket.handshake.query.Token;
	// join into new group
	socket.join(mainGroup);
	//catch user login on the querystring
	var user = socket.handshake.query.Login;
	//verify if user is present
	if (socketsOn[user]) {
		console.log('Duplicate user '+ user);
		socketsOn.splice(socketsOn.indexOf(user), 1);
		socketsOn[user].emit('Package', {io: 'Duplicate', user: user});
	}
		//store user by login and self sokcet id
		socketsOn[user] = socket;	
			connections.push({job: mainGroup, user: user});

			var senduserson = [];
			for (var i = connections.length - 1; i >= 0; i--) {
				if (connections[i].job == mainGroup) {
					senduserson.push(connections[i].user);
				}
			}
	    // emit user when new connection
		io.to(mainGroup).emit('Package', {io: 'New', user: user, online: senduserson});
		//console.clear();
		console.log(senduserson);
		//console.log(user +' Conectou');
	
    // emit disconect client
    socket.on('disconnect', function() {
	 	connections.splice(connections.indexOf(user), 1);
			console.log(user +' desconectou');
	   				 io.to(mainGroup).emit('Package', {io: 'Disconnect', user: user});
	});

    // ZEUS CALL
	socket.on('Package', ($data) => {
		// SEND MAILS
		if ($data.maillist) {
			if ($data.maillist.length < 1) return false;
			var mailOptions = [];
			$data.maillist.forEach(function (to, i , array) {
			  mailOptions.from = 'noreply@'+host;
			  mailOptions.subject = $data.subject;
			  mailOptions.to = to;
			  mailOptions.text = $data.message;
				transporter.sendMail(mailOptions, function(error, info){
				  if (error) { console.log('noreply@'+host,error); } 
				  else 		 { console.log('Email sent: ' + $data.subject, $data.message,to); }
				});
			});
			return false;
		}
		if ($data.direct) {
			
			if ($data.return) 
				socket.emit('Package', $data);	

			if (socketsOn[$data.direct]) 
			    socketsOn[$data.direct].emit('Package', $data);
			else 
			    socket.emit('Package', {io: 'TargetDisconnected', user: $data.direct});
			
			return;
		}

		else if ($data.Syb) {
			if ($data.Syb != subGroup) socket.emit('Package', $data);
			io.in($data.Syb).emit('Package', $data);
			console.log(user +' Enviou de '+ subGroup +' ao subgrupo ' + $data.Syb);
			return;
		}

		else {
			io.to(mainGroup).emit('Package', $data);
			console.log(user +' Enviou a todos de ' + mainGroup);
			return;
		}
	});

});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});
