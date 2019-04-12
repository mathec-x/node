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
	//SERVER CALL
	socket.on('MailTo', function (data)  {
		console.log('Test MailTo still not implements', data);
		//io.to(myroom).emit('RootScope', $data);
	})	
	if (socket.handshake.query.Host) {
		//console.log('Host', socket.handshake.query.Host, socket.handshake.query.Hash);		
		var transporter = nodemailer.createTransport({
			  host: 'mail.'+socket.handshake.query.Host+'.com.br',
			  port: '587',
			  secure: false,
			  auth: {
			    user: 'noreplay@'+socket.handshake.query.Host+'.com.br',
			    pass: socket.handshake.query.Hash
			  },
			  tls: { rejectUnauthorized: false }
			});
		if (socket.handshake.query.MailTo) {
			  var mailOptions = {
				  from : 'noreplay@'+socket.handshake.query.Host+'.com.br',
				  subject : socket.handshake.query.Subject,
				  to : socket.handshake.query.MailTo,
				  text : '',
				  html: socket.handshake.query.Html
			  };
				transporter.sendMail(mailOptions, (error, info) => {
				  if (error) { console.log(error); } 
				  else 		 { console.log('Email sent:', socket.handshake.query.MailTo); }
				});
		}
	}

	//include socket on JobId
	var myroom = socket.handshake.query.Token;
	// join into new group
	socket.join(myroom);
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
			connections.push({job: myroom, user: user});

			var senduserson = [];
			for (var i = connections.length - 1; i >= 0; i--) {
				if (connections[i].job == myroom) {
					senduserson.push(connections[i].user);
				}
			}
	    // emit user when new connection
		io.to(myroom).emit('Package', {io: 'New', user: user, online: senduserson});
		//console.clear();
		console.log(senduserson);
		console.log(user +' Conectou');
	
    // emit disconect client
    socket.on('disconnect', function() {
	 	connections.splice(connections.indexOf(user), 1);
			console.log(user +' desconectou');
	   				 io.to(myroom).emit('Package', {io: 'Disconnect', user: user});
	});

    // ZEUS CALL
	socket.on('Package', ($data) => {
		// SEND MAILS
		if ($data.maillist) {
			if ($data.maillist.length < 1) return false;
			$data.maillist.forEach(function (to, i , array) {
			  mailOptions.from = 'noreplay@'+socket.handshake.query.Host+'.com.br';
			  mailOptions.subject = $data.subject;
			  mailOptions.to = to;
			  mailOptions.text = $data.message;
				transporter.sendMail(mailOptions, function(error, info){
				  if (error) { console.log(error); } 
				  else 		 { console.log('Email sent: ' + $data.subject, $data.message,to); }
				});
			});
			return false;
		}
		//SEND DIRECT 
		// THIS THE PRINCIPAL, OR IS DIRECT OR NOT
		//  IF DIRECT OR RETURN OR NOT
		if ($data.direct) {
			if ($data.return) socket.emit('Package', $data);
	
			var cli = socketsOn[$data.direct];
			if (cli) {
			    cli.emit('Package', $data);
			    console.log('direct to ' + cli);
				return false;			
			} else {
			    socket.emit('Package', {io: 'TargetDisconnected', user: $data.direct});
			    console.log('direct to disconnected ' + $data.direct);
			    return false;		
			}

		} else {
			//SEND To ALL
			io.to(myroom).emit('Package', $data);
				console.log(user +' Enviou a todos de ' + myroom);
		}
	});

});

http.listen(port, function(){
	console.log("Conectado na porta :"+port);
});
