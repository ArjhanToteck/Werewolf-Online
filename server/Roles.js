const Roles = {
	villager: {
		role: {
			name: "villager",
			seenByOthers: "villager",
			seenBySelf: "villager"
		},

		faction: {
			name: "village",
			seenByOthers: "village",
			seenBySelf: "village"
		},

		chatViewPermissions: null,
		chatSendPermission: null
	},

	werewolf: {
		role: {
			name: "werewolf",
			seenByOthers: "werewolf",
			seenBySelf: "werewolf"
		},

		faction: {
			name: "wolfpack",
			seenByOthers: "wolfpack",
			seenBySelf: "wolfpack"
		},

		chatViewPermissions: ["wolfpack"],
		chatSendPermission: "wolfpack"
	},
}

// exports roles
module.exports =
{
  Roles
}