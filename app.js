var express = require('express'),
	app = express(),// instance of the express class
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	//keep track of nicknames to display it 
	users = {};
	
server.listen(3000);
app.use(express.static(__dirname + '/libs'));

// routing :  refers to the definition of application end points (URIs) and how they respond to client requests
app.get('/', function(req, res){
    // the following statement is the respond when a GET request is made to homepage
	res.sendfile(__dirname + '/index.html');
});

// recieve the msg from the user
io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
	  // check if nickname is exist in array or not
		nick = data[0];
		group = data[1];
		if(nick in users){
		callback(false);
		} else{
			callback(true);
                 // add user to socket 
			socket.nickname = nick;
			socket.group = group;
                  // using nicknames as a key and their values are sockets
			users[socket.nickname + "," + socket.group] = socket;
			io.sockets.emit('usernames', Object.keys(users));
			}
	});
	
	socket.on('send message', function(data, callback){
               
		// check if the client try to whisper by /w space
		var msg = data.trim();
		if(msg.substring(0,3) === '/w '){
			//hb3at le meen ?? ex: /w yomna blablabla try to get zefta yomna :))
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind != -1){
			// check if a whisper is valid nickname
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name + "," + socket.group in users){
					users[name + "," + socket.group].emit('whisper', {msg: msg, nick: socket.nickname, group: socket.group});
					users[socket.nickname + "," + socket.group].emit('whisper', {msg: msg, nick: socket.nickname, group: socket.group});
					console.log('whisper');
				} else{
					callback('Error:enter a valid user');
				}
			} else{
				callback('Error: please enter a msg for your whisper');	
			}
		} else{
  //broadcast to all users except me when server recieves it..
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname, group: socket.group});
        }
	});
    socket.on('disconnect', function(data){
		if(!socket.nickname) return;
           // remove nickname from array after disconnection
		delete users[socket.nickname + "," + socket.group];
		console.log(users);
           //udate userlist in clientside
		io.sockets.emit('usernames', Object.keys(users));
	});
});
