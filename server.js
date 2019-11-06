var app= require('express')();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var nodemailer = require('nodemailer');
var port = process.env.PORT || 5000;
var socketsOn = [];
var connections = [];
//ONLY FOR SECURITY //npm install --save helmet
var helmet = require('helmet');
	app.use(helmet());

// example of routing in node
app.get('/sendmail', function(req, res) {
	var transporter = nodemailer.createTransport({
	    host: req.query.host,
	    port: 587,
	    secure: false,
	    auth: {
	        user: req.query.sender, // Your email id
	        pass: req.query.pass // Your password
	    },
	    tls: {
	        rejectUnauthorized: false
	    }
	});
    var mailOptions = {
        from: 'noreply <'+req.query.sender+'>',
        to: req.query.user,
        subject: req.query.subject,
        text: req.query.html,
        html:  req.query.html
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
        	console.log(error);
            res.send(false);
        } else {
        	console.log('Email sent');
            res.send(true);
        }
    });  
    return false;
});
io.origins(['http://cicloinsight.com.br/','https://cicloinsight.com.br/', 'http://localhost:70']);
io.on('connection', function(socket) {
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
		socketsOn[user].emit('Package', {io: 'Duplicate', user: user});
	//	socketsOn.splice(socketsOn.indexOf(user), 1);
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
			for (var i = connections.length - 1; i >= 0; i--) {
				if (connections[i].user == user) {
					 connections.splice(i, 1);
				}
			}
				console.clear();
				console.log(connections);
				console.log(user +' desconectou');
		   				 io.to(mainGroup).emit('Package', {io: 'Disconnect', user: user});	      
	});

    // ZEUS CALL
	socket.on('Package', ($data) => {
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
