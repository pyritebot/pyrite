import type { Role, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class RoleCreations {
	name = Events.GuildRoleCreate

	static times = 0
	static roles: string[] = []

	async run(role: Role) {
		const guild = await prisma.guild.findUnique({
			where: { guild: role.guild.id },
			select: { antiRaid: true }
		})

		if (!guild?.antiRaid) return;
		
		RoleCreations.roles.push(role.id)
		RoleCreations.times++
		
		if (RoleCreations.times >= 5) {
			const auditLogFetch = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
			const log = auditLogFetch.entries.first()
			if (role.client.user?.id === log?.executor?.id) return
			const member = await role.guild.members.fetch(log?.executor?.id!)
			role.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(async r => await member.roles.remove(r, "Deleting too many roles").catch(async () => await r.setPermissions([], "Deleting too many roles").catch(() => {})))
			RoleCreations.roles.forEach(async r => await role.guild.roles.cache.get(r)?.delete().catch(() => { }))

			const guild = await prisma.guild.findUnique({
				where: { guild: role.guild.id },
				select: { logs: true }
			})
			
			const logs = member.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for creating too many roles.`,
					reason: `Too many roles created.`,
				})
			)
		}

		
		setTimeout(() => {
			RoleCreations.times = 0
			RoleCreations.roles = []
		}, 8000)
	}
}