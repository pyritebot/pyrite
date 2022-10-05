import type { GuildBasedChannel, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class ChannelDeletions {
	name = Events.ChannelDelete

	static times = 0

	async run(channel: GuildBasedChannel) {
		const guild = await prisma.guild.findUnique({
			where: { guild: channel.guild.id },
			select: { antiRaid: true }
		})

		if (!guild?.antiRaid) return;
		if (!channel.guild) return;
		
		ChannelDeletions.times++
		
		if (ChannelDeletions.times >= 5) {
			const auditLogFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
			const log = auditLogFetch.entries.first()
			if (channel.client.user?.id === log?.executor?.id) return
			const member = await channel.guild.members.fetch(log?.executor?.id!)
			channel.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(async r => await member.roles.remove(r, "Deleting too many channels").catch(async () => await r.setPermissions([], "Deleting too many channels").catch(() => { })))
			
			const guild = await prisma.guild.findUnique({
				where: { guild: channel.guild.id },
				select: { logs: true }
			})
	
			const logs = channel.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for deleting too many channels.`,
					reason: `Too many channels deleted.`,
				})
			)
		}

		setTimeout(() => {
			ChannelDeletions.times = 0
		}, 8000)
	}
}