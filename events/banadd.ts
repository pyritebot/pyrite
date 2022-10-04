import type { GuildBan, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class BanAdd {
	name = Events.GuildBanAdd

	static times = 0
	static users: string[] = []

	async run(ban: GuildBan) {
		BanAdd.users.push(ban.user.id)
		BanAdd.times++

		if (BanAdd.times >= 5) {
			const auditLogFetch = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
			const log = auditLogFetch.entries.first()
			if (ban.client.user?.id === log?.executor?.id) return
			const member = await ban.guild.members.fetch(log?.executor?.id!)
			ban.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(async r => await member.roles.remove(r, "Banning too many users").catch(async () => await r.setPermissions([], "Banning too many users").catch(() => { })))
			BanAdd.users.forEach(async u => await ban.guild.bans.remove(u).catch(() => {}))

			const guild = await prisma.guild.findUnique({
				where: { guild: ban.guild.id },
				select: { logs: true }
			})
	
			const logs = ban.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for banning too many users.`,
					reason: `Too many users banned`,
				})
			)
		}

		setTimeout(() => {
			BanAdd.times = 0
			BanAdd.users = []
		}, 8000)
	}
}