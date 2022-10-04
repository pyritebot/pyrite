import type { Role, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class RoleDeletions {
	name = Events.GuildRoleDelete

	static times = 0

	async run(role: Role) {
		const guild = await prisma.guild.findUnique({
			where: { guild: role.guild.id },
			select: { antiRaid: true }
		})

		if (!guild?.antiRaid) return;
		
		RoleDeletions.times++
		
		if (RoleDeletions.times >= 5) {
			const auditLogFetch = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
			const log = auditLogFetch.entries.first()
			if (role.client.user?.id === log?.executor?.id) return
			const member = await role.guild.members.fetch(log?.executor?.id!)
			role.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(async r => await member.roles.remove(r, "Deleting too many roles").catch(async () => await r.setPermissions([], "Deleting too many roles").catch(() => {})))

			const guild = await prisma.guild.findUnique({
				where: { guild: member.guild.id },
				select: { logs: true }
			})
			
			const logs = member.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for deleting too many roles.`,
					reason: `Too many roles deleting.`,
				})
			)
		}

		
		setTimeout(() => {
			RoleDeletions.times = 0
		}, 8000)
	}
}