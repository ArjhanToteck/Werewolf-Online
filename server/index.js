const http = require("http");
const WebSocketServer = require("websocket").server;

const Game = require("./Game.js").Game;
const Player = require("./Player.js").Player;

// replace this with front end domain
const frontend = "https://null.jsbin.com";

// opens http server
let server = http.createServer(function(req, res) {
	const headers = {
      "Access-Control-Allow-Origin": "*",
			"Content-Type": "text/plain"
  };

	if (req.method === "POST") {
		// no path
		if (req.url.split("/").length <= 2) {
			res.writeHead(404, headers);

			res.end("Action not specified\n");
		} else {
			const action = req.url.split("/")[1];

			switch (action) {
				case "startGame":
					if(req.url.split("/").length == 3){
						res.writeHead(200, headers);

						res.end(JSON.stringify(startGame(decodeURI(req.url.split("/")[2]))));
					} else {
						res.end("Name missing\n");
					}
				break;

				case "joinGame":
					if(req.url.split("/").length == 5){
						// attempts to join game
						const response = joinGame(decodeURI(req.url.split("/")[2]), decodeURI(req.url.split("/")[3]), decodeURI(req.url.split("/")[4]));

						// invalid code
						if(response == false){
							res.writeHead(404, headers);

							res.end("Game not found\n");
						} else {
							// successfully joined game and returns player password
							res.writeHead(200, headers);

							res.end(response);
						}
					} else {
						res.writeHead(404, headers);

						res.end("Name and/or code missing\n");
					}
				break;

				default:
					res.writeHead(404, headers);

					res.end("Action invalid\n");
				break;
			}
		}
	}
	else
	{
		res.writeHead(405, headers);

		res.end("Method Not Allowed\n");
	}
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
	if (request.origin.indexOf(frontend) == -1) {
		// rejects bad request
      request.reject();
      return;
  } else {
		const connection = request.accept(null, request.origin);

		// listens for connection to game
		connection.on("message", function(data) {
        if (verifyMessage(data)) {
					const message = JSON.parse(data.utf8Data);

					const game = Game.games[Game.codes.indexOf(message.code)];
					let player = game.players[game.passwords.indexOf(message.password)];

					// checks if connection is in player object
					if(player.connections.includes(connection) == false){

						// adds connection to player
						player.connections.push(connection);
						connection.player = player;
						game.connections.push(connection);
						
						// sends current chat to player
						connection.sendUTF(JSON.stringify({action: "recieveMessage", messages: game.chat}));
					}

					// calls all onMessageEvents in player
					for(let i = 0; i < player.onMessageEvents.length; i++){
						player.onMessageEvents[i](message, player);
					}
        }
		});
	}
});

function startGame(name) {
	// creates new game
	let newGame = new Game();
	
	// creates new player 
	let player = newGame.join(name, false);
	player.host = true;

	// game creation message
	newGame.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: `${player.name} has started the game. Use <c>!help</c>`}]});

	// returns new game's code and password of new player
	return {code: newGame.code, password: player.password};
}

function joinGame(code, name, spectator) {
	// gets index of code
	const index = Game.codes.indexOf(code);

	// makes sure code is valid
	if(index == -1){
		return false;
	} else {
		// joins game and returns new player password
		let player = Game.games[index].join(name, spectator);

		// message that they joined the game
		Game.games[index].sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: `${player.name} has joined the game.`}]});

		// returns password
		return player.password;
	}
}

function verifyMessage(data) {
	if (data.type == "utf8") {
		// parses message
		const message = JSON.parse(data.utf8Data);

		// checks if message is to link player and game is valid
		if (Game.codes.includes(message.code)) {
			const game = Game.games[Game.codes.indexOf(message.code)];

			// checks if password is valid
			if (game.passwords.includes(message.password)) {
				let player = game.players[game.passwords.indexOf(message.password)];

				return true;
			}
		}

		return false;
	}
}