const http = require("http");
const WebSocketServer = require("websocket").server;
const Database = require("@replit/database")

// opens database
const chat = new Database();

// keeps track of open connections
let connections = [];

// opens http server
let server = http.createServer(function(req, res) {
	const headers = {
		"Access-Control-Allow-Origin": "arjhantoteck.netlify.app",
		"Content-Type": "text/plain"
	};

	res.writeHead(200, headers);
	res.end("Placeholder, lmao");
});
server.listen(8443);
console.log("Server running on port 8443");

// opens websocket server
wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on("request", function(request) {
	// checks if origin matches
	if (request.origin.indexOf("arjhantoteck.netlify.app") == -1) {
		// rejects bad request
		request.reject();
		return;
	} else {
		let connection = request.accept(null, request.origin);
		connections.push(connection);
		
		// sends chat history to connection
		chat.get("chat").then((data) => {
			connection.sendUTF(JSON.stringify(data));
		});
		

		// listens for connection to game
		connection.on("message", function(data) {
			const message = JSON.parse(data.utf8Data);

			if(!message.message || !message.date){
				return;
			}

			// gets current chat from database
			let currentChat = chat.get("chat").then((data) => {
				let currentChat = data;
				
				// modifies chat to add message
				currentChat.push({
					message: message.message,
					date: message.date,
					sender: "Anonymous"
				});	

				// sets chat to modified version
				chat.set("chat", currentChat);
			});	

			// pushes message out to all connections
			for (let i = 0; i < connections.length; i++) {
				connections[i].sendUTF(JSON.stringify([{
					message: message.message,
					date: message.date,
					sender: "Anonymous"
				}]));
			}
		});

		// prepares for connection to close
		connection.on("close", function() {
			// removes connection from chat room
			connections = connections.splice(connections.indexOf(connection), 1);
		});
	}
});
