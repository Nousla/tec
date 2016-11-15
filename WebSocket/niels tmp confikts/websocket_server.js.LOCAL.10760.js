var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var url = require('url');
var rooms = ['Lobby'];

var commands = new Map();
<<<<<<< HEAD
commands.set('send', send);
commands.set('create', create);
=======
commands.set('msg_send', sendMsg);
commands.set('name_set', setName);
commands.set('chatroom_req', reqChatroom);

var names = new Map();
>>>>>>> 2fd09a2df528b4159e81010cbf9e1f49b07afebd

express.get('/', function(req, res){
	res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
	url.parse(ws.upgradeReq.url, true);

    ws.on('message', function(msg) {
<<<<<<< HEAD
		if(msg.length === 0){
			return;
		}

		var msgs = msg.split(" ");
		var cmd = msgs[0];
		var args = msgs.slice(1,msgs.length);

		if(commands.has(cmd)){
			commands.get(cmd)(ws, args);
=======
		var cmd = parseMessage(msg);
		if(cmd == undefined){
			return;
		}
		
		if(commands.has(cmd.code)){
			commands.get(cmd.code)(ws, cmd.args);
>>>>>>> 2fd09a2df528b4159e81010cbf9e1f49b07afebd
		}
    });
	
	ws.on('close', function() {
		if(ws.name != undefined && names.has(ws.name)){
			names.delete(ws.name);
		}
	});
});

http.on('request', express);
http.listen(3000, function(){
	console.log('Listening on ' + port);
});

function parseMessage(msg){
	if(msg.length == 0){
		return;
	}
	
	var msgs = msg.split(" ");
	var cmd = {
		code : msgs[0],
		args : msgs.slice(1,msgs.length)
	}
	
	return cmd;
}

function sendMsg(ws, args){
	msg = args.join(" ");
	wss.clients.forEach(function each(client) {
		send(client, 'msg_received', msg);
	});
	console.log("Message received: " + msg);
}

<<<<<<< HEAD
function create(ws, args){
	rooms.push(args);
	console.log('room created ' + args);
}
=======
function reqChatroom(id){
	console.log('server: finding chatroom id');
	
}

function setName(ws, args){
	if(args.length != 1){
		ws.send('name_error');
	}
	
	ws.name = args[0];
	names.set(ws.name,ws);
	send(ws, 'name_changed', ws.name);
	console.log("Changed client name to: " + ws.name);
}

function send(ws, code, args){
	ws.send(code + " " + args);
}
>>>>>>> 2fd09a2df528b4159e81010cbf9e1f49b07afebd
