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

	// join function
  this.join = function(name, spectator){
		let player = new Player(name, this, spectator);
		this.players.push(player);
		this.passwords.push(player.password);

		return player.password;
  }

	// chat
	this.chat = [];
}

function Message(sender, content){
	this.sender = sender;
	this.time = new Date();
	this.content = content;
}