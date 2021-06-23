const Player = require('./Player.js').Player;

// exports game constructor
module.exports =
   {
     Game
   }
  
// game constructor

Game.games = [];
Game.codes = [];

function Game(){
  // pushes game to static game.games
  Game.games.push(this);

  // generates code
  while(!this.code || Game.codes.includes(this.code)){
    this.code = Math.round(Math.random() * (999999 - 111111) + 111111);
		this.code = this.code.toString();
  }

  // adds code to list
  Game.codes.push(this.code);

  // players
  this.players = [];

	// passwords
  this.passwords = [];
	
	// connections
	this.connections = [];

	// chat
	this.chat = [];

	// inGame
	this.inGame = false;

	// dayPhase
	this.dayPhase = {phase: "gameNotStarted", timeStarted: new Date()};

	// join function
  this.join = function(name, spectator){
		let player = new Player(name, this, spectator);
		player.game = this;
		this.players.push(player);
		this.passwords.push(player.password);

		return player;
  }

		// start game function
	this.startGame = function(player){
		this.inGame = true;
		this.dayPhase = {phase: "day", timeStarted: new Date()};
		this.chat = [];
		this.sendMessage({action: "clearChat"});
		this.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: `${player.name} has started the game.`}]})
	}

	this.sendMessage = function(message){
		// loops through all websockets
		for(let i = 0; i < this.connections.length; i++){
			// sends message to close game
			this.connections[i].sendUTF(JSON.stringify(message));
		}

		// adds message to chat list if applicable
		if(message.action == "recieveMessage"){
			this.chat = this.chat.concat(message.messages);
		}
	}

	// closes game if inactive
	setTimeout(() => {
		this.sendMessage({action: "gameClosed", message: "This game was closed since it has been open for 15 minutes without starting."});
	}, 900000); // 900000 milliseconds = 15 minutes
}