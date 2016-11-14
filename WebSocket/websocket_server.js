var port = 3000;
var express = require('express')();
var http = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var url = require('url');

express.get('/', function(req, res){
	res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
	url.parse(ws.upgradeReq.url, true);

    ws.on('message', function(event) {
        wss.clients.forEach(function each(client) {
			client.send(event);
		});
		console.log("Message received: " + event);
    });
});

http.on('request', express);
http.listen(3000, function(){
  console.log('Listening on ' + port);
});