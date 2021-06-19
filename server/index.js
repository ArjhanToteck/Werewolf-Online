const http = require("http");
const WebSocketServer = require("websocket").server;

const Game = require("./Game.js").Game;
const Player = require("./Player.js").Player;
let test;

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
					res.writeHead(200, headers);

					res.end(startGame());

					break;

				case "joinGame":
					if(req.url.split("/").length == 5){
						// attempts to join game
						const response = joinGame(req.url.split("/")[2], req.url.split("/")[3] , req.url.split("/")[4]);

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
	console.log(request.resourceURL.query);
	// checks if origin matches
	if (request.origin.indexOf(frontend) == -1) {
		// rejects bad request
      request.reject();
      return;
  } else {
		const connection = request.accept(null, request.origin);

		// listens for connection to game
		connection.on("message", function(message) {
			test = message;

        if (message.type == "utf8") {
					// parses message
          const data = JSON.parse(message.utf8Data);

					// checks if message is to link player and game is valid
					if(data.action == "linkConnection" && Game.codes.includes(data.code)){
						const game = Game.games[Game.codes.indexOf(data.code)];

						// checks if password is valid
						if(game.passwords.includes(data.password)){
							let player = game.players[game.passwords.indexOf(data.password)];

							// links connection to player with matching password
							player.linkConnection(connection);
						}
					}
        }
		});
	}
});

function startGame() {
	let newGame = new Game();

	return newGame.code;
}

function joinGame(code, name, spectator) {
	console.log(Game.codes);
	const index = Game.codes.indexOf(code);
	if(index == -1){
		return false;
	} else {
		return Game.games[index].join(name, spectator);
	}
}