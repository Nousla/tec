timers = {}

var port = 3000;
var app = require('express')();
var http = require('http').Server(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });

app.get('/', function(req, res){
	res.sendFile(__dirname + '/websocket_client.html');
});

wss.on('connection', function connection(ws) {
	var location = url.parse(ws.upgradeReq.url, true);

    ws.on('message', function(event) {
        wss.clients.forEach(function each(client) {
			client.send(event);
		});
		console.log("Message received: " + event);
    });
});

http.listen(3000, function(){
  console.log('Listening on ' + http.address().port);
});