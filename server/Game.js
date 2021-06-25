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
	this.players = [];
  this.passwords = [];
	this.connections = [];
	this.chat = [];
	this.inGame = false;
	this.votingOpen = false;
	this.dayPhase = {phase: null, timeStarted: new Date()};

  // pushes game to static game.games
  Game.games.push(this);

  // generates code
  while(!this.code || Game.codes.includes(this.code)){
    this.code = Math.round(Math.random() * (999999 - 111111) + 111111);
		this.code = this.code.toString();
  }

  // adds code to list
  Game.codes.push(this.code);

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
		this.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: `${player.name} has started the game.`, permission: "village"}]});

		// changes day phase in 2.5 minutes
		setTimeout(() => {
			this.changeDayPhase();
		}, 150000); // 150000 = 2.5 minutes
	}

	this.changeDayPhase = function(){
		// checks how many players are ready
		let readyCount = 0;

		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].ready) readyCount++;
		}

		// changes actual cycle
		setTimeout(() => {
			// checks if day
			if(this.dayPhase.phase == "day"){
				// makes it night
				this.dayPhase = {phase: "night", timeStarted: new Date()};

				// closes voting
				this.votingOpen = false;

				// tells everyone it's night
				this.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: "The stars begin to shine as the sky turns black. The town is consumed by the night.", permission: "village"}]});

				// sets night chat chatViewPermissions
				for(let i = 0; i < this.players.length; i++){
					this.players[i].ch
				}
			} else {
				// makes it day
				this.dayPhase = {phase: "day", timeStarted: new Date()};

				// opens voting
				this.votingOpen = true;

				// tells everyone it's day
				this.sendMessage({action: "recieveMessage", messages: [{sender: "Moderator", date: new Date().toString(), message: "The sun rises in the horizon... it is now morning.", permission: "village"}]});
			}
		}, (readyCount / this.players.length) * 180000); // calculates milliseconds left until day phase depending on ready ratio
	}

	this.sendMessage = function(message){
		// loops through all websockets
		for(let i = 0; i < this.connections.length; i++){
			// sends message to close game
			if(this.connections[i].player.chatViewPermissions.includes(message.permission)) this.connections[i].sendUTF(JSON.stringify(message));
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