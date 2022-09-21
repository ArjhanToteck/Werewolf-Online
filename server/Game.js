const Player = require('./Player.js').Player;
const Roles = require("./Roles.js");
const deepClone = require("lodash.clonedeep");

// game constructor

Game.games = [];
Game.codes = [];
Game.publicGames = [];

function Game() {
	this.constructor = Game;
	this.dateOpened = new Date();
	this.day = 1;
	this.players = [];
	this.passwords = [];
	this.chat = [];
	this.bannedIps = [];
	this.connections = [];
	this.inGame = false;
	this.gameEnded = false;
	this.votingOpen = false;
	this.settings = {
		allowPlayersToJoin: true,
		allowSelfVotes: false,
		public: false,
		revealRolesInGame: true,
		revealRolesOnDeath: false
	}
	this.votes = {};
	this.data = {
		wolfpack: {
			killsAllowed: 1
		}
	};

	this.dayPhase = {
		phase: null,
		timeStarted: new Date()
	};

	// pushes game to static game.games
	Game.games.push(this);

	// generates code
	while (!this.code || Game.codes.includes(this.code)) {
		this.code = Math.round(Math.random() * (999999 - 111111) + 111111);
		this.code = this.code.toString();
	}

	// adds code to list
	Game.codes.push(this.code);

	// join function
	this.join = function(name) {
		// checks if players are allowed to join right now
		if (!this.settings.allowPlayersToJoin) {
			return {
				failed: true,
				reason: "This game is not allowing new players to join right now."
			}
		}

		// checks if name is taken
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].name == name) {
				return {
					failed: true,
					reason: "That username is already taken."
				}
			}
		}

		// generates player
		let player = new Player(name, this);
		player.game = this;
		this.players.push(player);
		this.passwords.push(player.password);

		return player;
	}

	// start game function
	this.startGame = function(player) {
		
		// removes game from public list
		if (Game.publicGames.includes(this)) Game.publicGames.splice(Game.publicGames.indexOf(this), 1);

		// sets game data
		this.inGame = true;
		this.dayPhase = {
			phase: "day",
			timeStarted: new Date()
		};

		this.chat = [];
		this.sendMessage({
			action: "clearChat"
		});

		// tells players game started
		this.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				date: new Date().toString(),
				message: `${player.name} has started the game.`,
				permission: "village"
			}]
		});

		// assigns roles to players
		this.assignRoles();

		this.sendMessage = function(message) {
			// adds message to chat list if applicable
			if (message.action == "recieveMessage") {
				this.chat = this.chat.concat(message.messages);
			}

			// loops through all websockets
			for (let i = 0; i < this.connections.length; i++) {
				// alteredMessage will not contain inaccessible messages
				let alteredMessage = deepClone(message);

				if (message.action == "recieveMessage") {
					for (let j = 0; j < alteredMessage.messages.length; j++) {
						// checks if permissions are appropriate for current message
						let permissionIncluded = false;

						var k = 0;

						// loops through permissions and checks if they match
						for (k = 0; k < this.connections[i].player.chatViewPermissions.length; k++) {
							if (this.connections[i].player.chatViewPermissions[k].name == message.messages[j].permission) {
								permissionIncluded = true;
								break;
							}
						}

						// checks if permission was had at the time the message was sent
						if (!permissionIncluded || this.connections[i].player.chatViewPermissions[k].start > message.messages[j].date || (!!this.connections[i].player.chatViewPermissions[k].end && this.connections[i].player.chatViewPermissions[k].end < message.messages[j].date)) {
							// removes current message
							alteredMessage.messages.splice(j, 1);

							// subtracts from j to compensate for removed message
							j--;
						}
					}

					// checks if any messages are to be sent
					if (alteredMessage.messages.length > 0) {
						this.connections[i].sendUTF(JSON.stringify(alteredMessage));
					}
				} else {
					this.connections[i].sendUTF(JSON.stringify(alteredMessage));
				}
			}
		}

		// warns that day phase will change in 30 seconds
		setTimeout(() => {
			this.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					date: new Date().toString(),
					message: "It will soon be " + (this.dayPhase.phase == "day" ? "night" : "day") + "...",
					permission: "village"
				}]
			});

			// changes day phase in 10 seconds
			setTimeout(() => {
				this.changeDayPhase();
			}, 10000); // 10000 milliseconds = 10 seconds

		}, 30000); // 30000 milliseconds = 30 seconds
	}

	this.assignRoles = function() {
		roles = Roles.generateRoles(this);

		// loops through players
		for (let i = 0; i < this.players.length; i++) {
			currentRole = deepClone(roles[i]);
			this.players[i].role = currentRole;

			// checks if role contains chatViewPermissions
			if (!!currentRole.chatViewPermissions) {
				// puts together list of chatViewPermissions
				for (let j = 0; j < currentRole.chatViewPermissions.length; j++) {
					this.players[i].chatViewPermissions.push({
						name: currentRole.chatViewPermissions[j],
						start: new Date(),
						end: null
					});
				}
			}

			// checks if role contains chatSendPermission
			if (!!currentRole.chatSendPermission) this.players[i].nightChatSendPermission = currentRole.chatSendPermission;

			// adds role data to player
			if (!!currentRole.onMessageEvent) this.players[i].onMessageEvents.push(currentRole.onMessageEvent);
			if (!!currentRole.onDayEndEvent) this.players[i].onDayEndEvents.push(currentRole.onDayEndEvent);
			if (!!currentRole.onNightEndEvent) this.players[i].onNightEndEvents.push(currentRole.onNightEndEvent);
			if (!!currentRole.onDeathEvent) this.players[i].onDeathEvents.push(currentRole.onDeathEvent);
			if (!!currentRole.subfactions) this.players[i].subfactions = this.players[i].subfactions.concat(currentRole.subfactions);

			// tells player about their role
			this.players[i].game.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					message: currentRole.description,
					date: new Date(),
					permission: `user:${this.players[i].name}`
				}]
			});
		}

		// checks if roles are set to be revealed
		if (this.settings.revealRolesInGame) {
			let alphabetizedRoles = [];

			// puts names of roles into new array
			for (let i = 0; i < roles.length; i++) {
				alphabetizedRoles.push(`<a href="roles/${roles[i].role.name.split(" ").join("%20")}.html">${roles[i].role.name}</a>`);
			}

			// alphabetizes roles list
			alphabetizedRoles.sort();

			this.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					date: new Date().toString(),
					message: `This game has the following roles: <br> &nbsp; - ${alphabetizedRoles.join("<br> &nbsp; - ")}`,
					permission: "village"
				}]
			});
		}
	}

	this.waitUntilNextDayPhase = function() {
		// day phase does not change if game is over
		if (this.gameEnded) return;

		// keeps track of minutes passed
		var minutesPassed = 0;

		// waits 30 seconds
		const checkLoop = setInterval(() => {
			// one more minute has passed
			minutesPassed += 0.5;

			// checks how many players are ready
			let livingCount = this.players.length;
			let readyCount = 0;

			// day to night
			if (this.dayPhase.phase == "day") {
				// loops through players to see how many are ready
				for (let i = 0; i < this.players.length; i++) {
					let currentPlayer = this.players[i];

					// does not count dead player
					if (currentPlayer.dead) {
						livingCount--;
						continue;
					}

					if (!!currentPlayer.vote) {
						readyCount++;
					}
				}

				// night to day
			} else {
				// accounts for wolfpack kill
				livingCount++;

				if (!!this.data.wolfpack.targets && this.data.wolfpack.targets.length != 0) {
					readyCount++;
				}

				// loops through players to see how many are ready
				for (let i = 0; i < this.players.length; i++) {
					let currentPlayer = this.players[i];

					// does not count dead player
					if (currentPlayer.dead) {
						livingCount--;
						continue;
					}

					if (currentPlayer.ready) {
						readyCount++;
					}
				}
			}

			// checks if at least 70% of players are ready or if three minutes have passed
			if (readyCount / livingCount > 0.7 || minutesPassed >= 4) {
				clearInterval(checkLoop);

				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "It will soon be " + (this.dayPhase.phase == "day" ? "night" : "day") + "...",
						permission: "village"
					}]
				});

				// changes day phase in 10 seconds
				setTimeout(() => {
					this.changeDayPhase();
				}, 10000); // 10000 milliseconds = 10 seconds
			}
		}, 30000); // 30000 milliseconds = 30 seconds
	};

	this.changeDayPhase = function(ignoreNextCycle = false) {
		// day phase does not change if game is over
		if (this.gameEnded) return;

		// checks if day
		if (this.dayPhase.phase == "day") {
			// makes it night
			this.dayPhase = {
				phase: "night",
				timeStarted: new Date()
			};

			// closes voting
			this.votingOpen = false;

			// voting closed on day 1
			if (this.day != 1) {
				// gets voting results
				let victim = null;

				for (let i = 0; i < Object.keys(this.votes).length; i++) {
					let currentVote = this.votes[Object.keys(this.votes)[i]];
					if (!victim) {
						victim = currentVote;
						continue;
					}

					// only changes tie if vote is higher
					if (victim.tied) {
						if (currentVote.voters.length > victim.votes) {
							victim = currentVote;
							continue;
						}
					}

					// creates tie if votes are equal in number
					if (currentVote.voters.length == victim.voters.length) {
						victim = {
							tied: true,
							votes: victim.voters.length,
							players: [victim.player, currentVote.player]
						};
						continue;
					}

					// replaces victim if there are more votes for currentPlayer
					if (currentVote.voters.length > victim.voters.length) {
						victim = currentVote;
					}
				}

				// checks if no votes were cast
				if (victim == null) {
					// tells village about no lynch
					this.sendMessage({
						action: "recieveMessage",
						messages: [{
							sender: "Moderator",
							date: new Date().toString(),
							message: "You forgot to vote! Now I don't get to watch anyone die! Remember to use <c>!vote username</c> to vote for people to hang.",
							permission: "village"
						}]
					});
				} else {
					// checks if votes were tied
					if (victim.tied) {
						// tells village about tie
						this.sendMessage({
							action: "recieveMessage",
							messages: [{
								sender: "Moderator",
								date: new Date().toString(),
								message: `The votes were tied between ${victim.players[0].name} and ${victim.players[1].name}. As a result, nobody was lynched today. What a shame.`,
								permission: "village"
							}]
						});
					} else {
						// kills player with most votes
						victim.player.die({
							lynched: true,
							voters: victim.voters
						}, true, `${victim.player.name} was lynched by the village.`);
					}
				}
			}

			// resets votes
			this.votes = {};

			// stops day/night cycle if game is over (specificially because a tanner would have ended the game if they were lynched)
			if (this.gameEnded) {
				return;
			}

			// tells everyone it's night
			this.sendMessage({
				action: "recieveMessage",
				messages: [{
					sender: "Moderator",
					date: new Date().toString(),
					message: "The stars begin to shine as the sky turns black. The town is consumed by the night.",
					permission: "village"
				}]
			});

			// loops through players
			for (let i = 0; i < this.players.length; i++) {
				let currentPlayer = this.players[i];

				// resets some data
				currentPlayer.onProtectEvents = [];
				currentPlayer.protection = [];

				// checks if dead
				if (currentPlayer.dead == false) {
					// this player has a night chat
					if (!!currentPlayer.nightChatSendPermission) {
						currentPlayer.chatSendPermission = currentPlayer.nightChatSendPermission;
					} else {
						// sets night chat to private chat with moderator for player to use commands and stuff
						currentPlayer.chatSendPermission = `user:${currentPlayer.name}`;
					}
				}

				// loops through dayEndEvents in each player
				for (let j = 0; j < this.players[i].onDayEndEvents.length; j++) {
					// sets ready state
					this.players[i].ready = true;

					// calls each event
					this.players[i].onDayEndEvents[j](this.players[i]);
				}
			}

			// waits until night
			if (!ignoreNextCycle) this.waitUntilNextDayPhase();
		} else {
			// makes it day
			this.dayPhase = {
				phase: "day",
				timeStarted: new Date()
			};

			// accounts for new day
			this.day++;

			// resets some data
			this.data.wolfpack.killsAllowed = 1;

			// tracks living wolves and villagers
			let livingWolves = [];
			let livingNonWolves = [];

			// loops through players
			for (let i = 0; i < this.players.length; i++) {
				let currentPlayer = this.players[i];

				// resets vote
				currentPlayer.vote = null;

				// checks if dead
				if (currentPlayer.dead == false) {
					// sets chat permissions for day
					this.players[i].chatSendPermission = "village";
				}

				// loops through nightEndEvents in each player
				for (let j = 0; j < this.players[i].onNightEndEvents.length; j++) {
					// sets ready state for voters
					this.players[i].ready = false;

					// calls each event
					this.players[i].onNightEndEvents[j](this.players[i]);
				}

				// gets data for win conditions
				if (!currentPlayer.dead) {
					if (currentPlayer.role.faction.name == "wolfpack" && currentPlayer.role.name !== "traitor") {
						livingWolves.push(currentPlayer);
					} else if (currentPlayer.role.name !== "traitor") {
						livingNonWolves.push(currentPlayer);
					}
				}
			}

			// extinction
			if (livingWolves.length == 0 && livingNonWolves.length == 0) {
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "The sun rises, red and dim, as if mourning the countless deaths. The villages is completely desolate, save the flies and vultures circling the countless rotting corpses littered throughout the streets. The game is over but nobody survived to win it.",
						permission: "village"
					}]
				});

				this.endGame();

				// wolfpack wins
			} else if (livingWolves.length >= livingNonWolves.length) {
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "Morning arrives, lighting the village and revealing the werewolves that now innhabit it, feeding on the dead villagers. The wolfpack wins.",
						permission: "village"
					}]
				});

				this.endGame();

				// village wins
			} else if (livingWolves.length == 0 && livingNonWolves.length > 0) {
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "A rooster's crow wakes the village, and a quiet morning ensues. The werewolves are completely gone and the town is at peace once more. The village wins.",
						permission: "village"
					}]
				});

				this.endGame();

			} else {
				// game hasn't ended yet

				// opens voting
				this.votingOpen = true;
				this.votes = {};

				// tells players it's morning
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "The sun rises in the horizon... it is now morning.",
						permission: "village"
					}]
				});

				// tells players voting is open
				this.sendMessage({
					action: "recieveMessage",
					messages: [{
						sender: "Moderator",
						date: new Date().toString(),
						message: "Voting is open to try and lynch a werewolf. Use the command <c>!vote username</c> to vote to lynch a player. Use the command <c>!votes</c> to see a list of all the votes cast. The player with most votes will be hung to death. If there is a tie, nobody will be hung.",
						permission: "village"
					}]
				});

				// waits until night
				if (!ignoreNextCycle) this.waitUntilNextDayPhase();
			}
		}
	}

	this.sendMessage = function(message) {
		// adds message to chat list if applicable
		if (message.action == "recieveMessage") {
			this.chat = this.chat.concat(message.messages);
		}

		// loops through all players
		for (let l = 0; l < this.players.length; l++) {

			// loops through all websockets
			for (let i = 0; i < this.players[l].connections.length; i++) {
				// alteredMessage will not contain inaccessible messages
				let alteredMessage = deepClone(message);

				if (message.action == "recieveMessage") {
					for (let j = 0; j < alteredMessage.messages.length; j++) {
						// checks if permissions are appropriate for current message
						let permissionIncluded = false;

						var k = 0;

						// loops through permissions and checks if they match
						for (k = 0; k < this.players[l].connections[i].player.chatViewPermissions.length; k++) {
							if (this.players[l].connections[i].player.chatViewPermissions[k].name == message.messages[j].permission) {
								permissionIncluded = true;
								break;
							}
						}

						// checks if permission was had at the time the message was sent
						if (!permissionIncluded || this.players[l].connections[i].player.chatViewPermissions[k].start > message.messages[j].date || (!!this.players[l].connections[i].player.chatViewPermissions[k].end && this.players[l].connections[i].player.chatViewPermissions[k].end < message.messages[j].date)) {
							// removes current message
							alteredMessage.messages.splice(j, 1);

							// subtracts from j to compensate for removed message
							j--;
						}
					}

					// checks if any messages are to be sent
					if (alteredMessage.messages.length > 0) {
						this.players[l].connections[i].sendUTF(JSON.stringify(alteredMessage));
					}
				} else {
					this.players[l].connections[i].sendUTF(JSON.stringify(alteredMessage));
				}
			}
		}
	}

	this.endGame = function(skipWait = false, alert = true) {
		// loops through players
		for (let i = 0; i < this.players.length; i++) {
			// gives players village chat permission
			this.players[i].chatSendPermission = "village";
		}

		this.gameEnded = true;

		this.sendMessage({
			action: "recieveMessage",
			messages: [{
				sender: "Moderator",
				date: new Date().toString(),
				message: "This game is now over. The game room will automatically close in 10 minutes. You can leave before then, if you wish, by pressing the \"Leave Game\" button at the top of the screen. Thank you for playing.",
				permission: "village"
			}]
		});

		// closes game in five minutes
		setTimeout(() => {
			// kicks out players from frontend
			if (alert) {
				this.sendMessage({
					action: "gameClosed",
					message: "This game was closed since it has been over for 10 minutes. Thank you for playing."
				});
			}

			// clears game data
			let index = Game.codes.indexOf(this.code);
			Game.codes.splice(index, 1);
			Game.games.splice(index, 1);
			if (Game.publicGames.includes(this)) Game.publicGames.splice(index, 1);
		}, skipWait ? 0 : 600000); // 600000 milliseconds = 10 minutes

	}

	// closes game if inactive
	setTimeout(() => {
		if (this.inGame == false) {
			this.sendMessage({
				action: "gameClosed",
				message: "This game was closed since it has been open for 15 minutes without starting."
			});

			// clears game data
			let index = Game.codes.indexOf(this.code);
			Game.codes.splice(index, 1);
			Game.games.splice(index, 1);
			if (Game.publicGames.includes(this)) Game.publicGames.splice(index, 1);
		}
	}, 900000); // 900000 milliseconds = 15 minutes
}

// exports game constructor
module.exports = {
	Game
}
