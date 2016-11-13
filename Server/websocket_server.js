timers = {}

var WebSocketServer = require('ws').Server;
wss = new WebSocketServer({ port: 9999 , path: '/chat' });

wss.on('connection', function connection(ws) {
    ws.on('message', function(event) {
        wss.clients.forEach(function each(client) {
			client.send(client._socket.remoteAddress + " " + event);
		});
		console.log("Message received: " + event);
    });
});

