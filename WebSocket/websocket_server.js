var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var url = require('url');

var commands = new Map();
commands.set('msg_send', sendMsg);
commands.set('name_set', setName);

express.get('/', function(req, res){
	res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
	url.parse(ws.upgradeReq.url, true);

    ws.on('message', function(msg) {
		var cmd = parseMessage(msg);
		if(cmd == undefined){
			return;
		}
		
		if(commands.has(cmd.code)){
			commands.get(cmd.code)(ws, cmd.args);
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

function setName(ws, args){
	if(args.length != 1){
		ws.send('name_error');
	}
	
	ws.name = args[0];
	send(ws, 'name_changed', ws.name);
	console.log("Changed client name to: " + ws.name);
}

function send(ws, code, args){
	ws.send(code + " " + args);
}