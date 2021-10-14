const Roles = require("./Roles.js");
const Game = require("./Game.js");

// player constructor
function Player(name, game, host = false) {
	this.name = name.replace(/[\u00A0-\u9999<>\&]/gim, i => {
		return '&#' + i.charCodeAt(0) + ';'
	}); // removes HTML from name
	this.game = game;
	this.ips = [];
	this.host = host;
	this.role = null;
	this.subfactions = [];
	this.dead = false;
	this.vote = null;
	this.chatSendPermission = "village";
	this.nightChatSendPermission = `user:${this.name}`;
	this.chatViewPermissions = [{
		name: "village",
		start: this.game.dateOpened,
		end: null
	}, {
		name: `user:${this.name}`,
		start: this.game.dateOpened,
		end: null
	}];
	this.ready = true;
	this.data = {};
	this.protection = [];

	// generates random password for player
	this.password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

	// connections
	this.connections = [];

	// kick
	this.kick = function(ipBan = false) {
		// kicks player from frontend
		for (let i = 0; i < this.connections.length; i++) {
			this.connections[i].sendUTF(JSON.stringify({
				action: "gameClosed",
				message: `You were ${ipBan ? "permanently banned" : "kicked"} from the game.`
			}));
		}

		// IP ban
		if (ipBan) {
			this.game.bannedIps = this.game.bannedIps.concat(this.ips);
		}

		// deletes password from game
		this.game.passwords.splice(this.game.passwords.indexOf(this.password), 1);

		// deletes player from game
		this.game.players.splice(this.game.players.indexOf(this), 1);
	}

	// death
	this.die = function(killer, ignoreProtection = false, message = `${this.name} was found dead in the morning.`) {		
		// checks if protected
		if (!ignoreProtection && (typeof(this.protection) == "object" && this.protection.length > 0)) {
			for (let i = 0; i < this.onProtectEvents.length; i++) {
				this.onProtectEvents[i]();
			}
		} else {
			let deathMessage = message;

			if(this.game.settings.revealRolesOnDeath){
				deathMessage += " Now that they're dead, you examine their corpse and find out they were a " + this.role.role.name + "."
			}

			// makes sure not already dead
			if (this.dead == false) {
				this.dead = true;
				this.chatSendPermission = "dead";
				this.chatViewPermissions.push({
					name: "dead",
					start: new Date(),
					end: null
				});

				this.game.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						message: deathMessage,
						date: new Date(),
						permission: "village"
					}]
				});

				for (let i = 0; i < this.onDeathEvents.length; i++) {
					this.onDeathEvents[i](this, killer);
				}
			}
		}
	}

	this.onProtectEvents = [];
	this.onDeathEvents = [];
	this.onNightEndEvents = [];
	this.onDayEndEvents = [];

	// onMessageEvents
	this.onMessageEvents = [
		// sends message
		function(message, player) {
			if (message.action == "sendMessage" && !!message.message) {
				// changes message action
				let alteredMessage = {
					action: "recieveMessage",
					messages: [{
						sender: player.name,
						message: message.message.replace(/[\u00A0-\u9999<>\&]/gim, i => {
							return '&#' + i.charCodeAt(0) + ';'
						}), // removes html from message
						date: new Date(),
						permission: player.chatSendPermission
					}]
				};

				// sends altered message
				player.game.sendMessage(alteredMessage);
			}
		},

		// global commands
		function(message, player) {
			if (message.action == "sendMessage" && !!message.message) {
				// !ban command
				if (message.message.substring(0, 5) == "!ban ") {
					// checks if game started
					if (player.game.inGame == false) {

						// checks if player is host
						if (player.host) {
							// !ban Moderator easter egg
							if (message.message == "!ban Moderator") {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: "I thought we were friends!",
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							let target = null;

							// loops through players in game
							for (let i = 0; i < player.game.players.length; i++) {
								// checks if current player name matches target name
								if (player.game.players[i].name == message.message.substring(5)) {
									target = player.game.players[i];
									break;
								}
							}

							// target not found
							if (target == null) {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: `There is no player in the game called "${message.message.substring(5)}". Check your spelling or try copy-pasting their name.`,
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							// valid target

							// warns player
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `Are you sure you want to permanently ban ${message.message.substring(5)} out of the game? They will not be able to join back into the game. Bans cannot be reverted. Type <c>confirm</c> to confirm the ban.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// gets index of future onMessage event for self destruction purposes
							var index = player.onMessageEvents.length;
							var timesFired = 0;

							// checks for next message to be "confirm"
							player.onMessageEvents.push(function(message, player) {
								// makes sure second time being called
								timesFired++;
								if(timesFired == 1) return;

								if (message.action == "sendMessage" && !!message.message) {
									if (message.message == "confirm") {
										// sends message confirming kick
										player.game.sendMessage({
											action: "recieveMessage",
											messages: [{
												sender: "Moderator",
												message: `${target.name} was permanently banned by ${player.name}. Ouch.`,
												date: new Date(),
												permission: player.chatSendPermission
											}]
										});

										// bans target
										target.kick(true);
									}

									// event listener self destructs
									player.onMessageEvents.splice(index, 1);
								}
							})

						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "You can't ban anyone, lol, you dont have host permissions.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "The game already started, too late to ban anyone now.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
					}
				}

				// !kick command
				if (message.message.substring(0, 6) == "!kick ") {
					// checks if game started
					if (player.game.inGame == false) {

						// checks if player is host
						if (player.host) {
							// !kick Moderator easter egg
							if (message.message == "!kick Moderator") {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: "I thought we were friends!",
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							let target = null;

							// loops through players in game
							for (let i = 0; i < player.game.players.length; i++) {
								// checks if current player name matches target name
								if (player.game.players[i].name == message.message.substring(6)) {
									target = player.game.players[i];
									break;
								}
							}

							// target not found
							if (target == null) {
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: `There is no player in the game called "${message.message.substring(6)}". Check your spelling or try copy-pasting their name.`,
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});

								// exits function
								return;
							}

							// valid target

							// warns player
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `Are you sure you want to kick ${message.message.substring(6)} out of the game? They will still be able to join back. Type <c>confirm</c> to kick them out.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// gets index of future onMessage event for self destruction purposes
							var index = player.onMessageEvents.length;
							var timesFired = 0;

							// checks for next message to be "confirm"
							player.onMessageEvents.push(function(message, player) {
								// makes sure second time being called
								timesFired++;
								if(timesFired == 1) return;
								if (message.action == "sendMessage" && !!message.message) {
									if (message.message == "confirm") {
										// sends message confirming kick
										player.game.sendMessage({
											action: "recieveMessage",
											messages: [{
												sender: "Moderator",
												message: `${target.name} was kicked by ${player.name}.`,
												date: new Date(),
												permission: player.chatSendPermission
											}]
										});

										// kicks out target
										target.kick();
									}
								}

									// event listener self destructs
									player.onMessageEvents.splice(index, 1);
							});

						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "You can't kick anyone out, lmao, you dont have host permissions.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
					} else {
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "The game already started, too late to kick anyone out now.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
					}
				}

				// !vote command
				if (message.message.substring(0, 6) == "!vote ") {
					if(player.dead){
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: "You're dead, lmao.",
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						return;
					}

					if(player.game.votingOpen){
						// !vote Moderator easter egg
						if (message.message == "!vote Moderator") {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "What's wrong with you! I'm the moderator, an all-powerful being who doesn't even have a neck to be hung by!",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}

						let target = null;

						// loops through players in game
						for (let i = 0; i < player.game.players.length; i++) {
							// checks if current player name matches target name
							if (player.game.players[i].name == message.message.substring(6)) {
								target = player.game.players[i];
								break;
							}
						}

						// target not found
						if (target == null) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `There is no player in the game called "${message.message.substring(6)}". Check your spelling or try copy-pasting their name.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}

						// dead target
						if (target.dead) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `Who's gonna tell ${player.name} that ${target.name} is dead?`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							// exits function
							return;
						}

						// valid target

						// removes current vote if applicable
						if(!!player.vote){
							player.game.votes[player.vote.name].voters.splice(player.game.votes[player.vote.name].voters.indexOf(player, 1));
						}

						// adds vote
						if(!player.game.votes[target.name]) player.game.votes[target.name] = {player: target, voters: []};
						player.game.votes[target.name].voters.push(player);
						player.vote = target;

						// gets list of voters
						var votersList = [];

						for(let i = 0; i < player.game.votes[target.name].voters.length; i++){
							votersList.push(player.game.votes[target.name].voters[i].name);
						}

						if(player != target){
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `${player.name} is voting to lynch ${target.name}. \n People who voted for ${target.name}: <br> &nbsp; - ${votersList.join("<br> &nbsp; - ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `${player.name} is voting to lynch themselves. An interesting move indeed. People who voted for ${target.name}: <br> &nbsp; - ${votersList.join("<br> &nbsp; - ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
					}
				}

				switch (message.message) {
					// !players command
					case "!players":
						var playersList = [];

						// gets list of player names
						for (let i = 0; i < player.game.players.length; i++) {
							playersList.push(player.game.players[i].name);
						}

						// sends list of player names
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `All players currently in the game: ${playersList.join(", ")}`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});
						break;

						// !players alive command
					case "!players alive":
						var playersList = [];

						// gets list of living player names
						for (let i = 0; i < player.game.players.length; i++) {
							if (player.game.players[i].dead == false) playersList.push(player.game.players[i].name);
						}

						// checks if any living players are left
						if (playersList.length != 0) {
							// sends list of living player names
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `All players in the game that are currently still alive: ${playersList.join(", ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `No players in this game are left alive. Wow.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
						break;

					case "!players dead":
						var playersList = [];

						// gets list of dead player names
						for (let i = 0; i < player.game.players.length; i++) {
							if (player.game.players[i].dead) playersList.push(player.game.players[i].name);
						}

						// checks if any dead players are left
						if (playersList.length != 0) {
							// sends list of dead player names
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `All players in the game that are currently dead: ${playersList.join(", ")}`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						} else {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `No players in this game are dead. For now.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
						break;

					// !settings command
					case "!settings":
						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `Settings: <br> &nbsp; - Allow players to join (<c>!settings allowPlayersToJoin</c>): ${player.game.settings.allowPlayersToJoin} <br> &nbsp; - Public (<c>!settings public</c>): ${player.game.settings.public} <br> &nbsp; - Reveal list of roles in game (<c>!settings revealRolesInGame</c>): ${player.game.settings.revealRolesInGame} <br> &nbsp; - Reveal roles of dead players (<c>!settings revealRolesOnDeath</c>): ${player.game.settings.revealRolesOnDeath}`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						// checks if game started
						if (player.game.inGame){
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: "Note you cannot change these settings anymore since you are in the middle of a game.",
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});
						}
						
						break;

					// !settings allowPlayersToJoin command
					case "!settings allowPlayersToJoin":
						// checks if game started
						if(player.game.inGame){
							return;
						}

						// checks if player is host
						if (player.host == false) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `You need to have host permissions to change game settings.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						// valid usage of command

						// sets variable to opposite
						player.game.settings.allowPlayersToJoin = !player.game.settings.allowPlayersToJoin;

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `New players are ${player.game.settings.allowPlayersToJoin ? "now" : "no longer"} able to join the game.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						break;

					// !settings public command
					case "!settings public":
						// checks if game started
						if(player.game.inGame){
							return;
						}

						// checks if player is host
						if (player.host == false) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `You need to have host permissions to make the game public.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						// valid usage of command
						let Game = player.game.constructor;


						// sets to private
						if(player.game.settings.public){
							player.game.settings.public = false;
							Game.publicGames.splice(Game.publicGames.indexOf(player.game) , 1);

						// sets to public
						} else {
							player.game.settings.public = true;
							Game.publicGames.push(player.game);
						}

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `The game was now set to ${player.game.settings.public ? "public" : "private"}.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						break;

					// !settings revealRolesInGame command
					case "!settings revealRolesInGame":
						// checks if game started
						if(player.game.inGame){
							return;
						}

						// checks if player is host
						if (player.host == false) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `You need to have host permissions to change game settings.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						// valid usage of command

						// sets variable to opposite
						player.game.settings.revealRolesInGame = !player.game.settings.revealRolesInGame;

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `A list of roles ${player.game.settings.revealRolesInGame ? "will" : "will not"} be shown once the game starts.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						break;

					// !settings revealRolesOnDeath command
					case "!settings revealRolesOnDeath":
						// checks if game started
						if(player.game.inGame){
							return;
						}

						// checks if player is host
						if (player.host == false) {
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `You need to have host permissions to change game settings.`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						// valid usage of command

						// sets variable to opposite
						player.game.settings.revealRolesOnDeath = !player.game.settings.revealRolesOnDeath;

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `When a player dies in the game, their role ${player.game.settings.revealRolesOnDeath ? "will" : "will not"} be revealed.`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						break;

					// !start command
					case "!start":
						if (player.game.inGame == false) {
							if (player.game.players.length < 5){
								player.game.sendMessage({
									action: "recieveMessage",
									messages: [{
										sender: "Moderator",
										message: `You need at least 5 people to play the game. You currently only have ${player.game.players.length}. You can invite more people to join with the code ${player.game.code}.`,
										date: new Date(),
										permission: player.chatSendPermission
									}]
								});
							} else {
								player.game.startGame(player);
							}
						}
						break;

					case "!votes":
						// makes sure voting is open
						if(!player.game.votingOpen) return;

						// checks if no votes have been cast
						if (Object.keys(player.game.votes).length == 0){
							player.game.sendMessage({
								action: "recieveMessage",
								messages: [{
									sender: "Moderator",
									message: `No votes have been cast for anyone yet. Use <c>!vote</c> to vote to hang somebody! I want to see blood tonight!`,
									date: new Date(),
									permission: player.chatSendPermission
								}]
							});

							return;
						}

						var votesMessage = "";

						// loops through lynch candidates
						for(let i = 0; i < Object.keys(player.game.votes).length; i++){
							// adds name of person current lynch candidate
							votesMessage += `<br> &nbsp; - People who voted for ${Object.keys(player.game.votes)[i]}:`;

							// loops through voters for current lynch candidate
							for(let j = 0; j < player.game.votes[Object.keys(player.game.votes)[i]].voters.length; j++){
								// adds name of current voter
									votesMessage += `<br> &nbsp; &nbsp; - ${player.game.votes[Object.keys(player.game.votes)[i]].voters[j].name}`;
							}
							votesMessage += "<br>";
						}

						player.game.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								message: `A list of all votes: ${votesMessage}`,
								date: new Date(),
								permission: player.chatSendPermission
							}]
						});

						break;
				}
			}
		}
	];
}

// exports player constructor
module.exports = {
	Player
}