var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var url = require('url');

var commands = new Map();
commands.set('send', send);

express.get('/', function(req, res){
	res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
	url.parse(ws.upgradeReq.url, true);

    ws.on('message', function(msg) {
		if(msg.length == 0){
			return;
		}		
			
		var msgs = msg.split(" ");
		var cmd = msgs[0];
		var args = msgs.slice(1,msgs.length);
		
		if(commands.has(cmd)){
			commands.get(cmd)(ws, args);
		}
    });
});

http.on('request', express);
http.listen(3000, function(){
	console.log('Listening on ' + port);
});

function send(ws, args){
	msg = args.join(" ");
	wss.clients.forEach(function each(client) {
		client.send(msg);
	});
	console.log("Message received: " + msg);
}