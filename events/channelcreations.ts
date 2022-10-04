import type { GuildBasedChannel, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class ChannelCreations {
	name = Events.ChannelCreate

	static times = 0
	static channels: string[] = []

	async run(channel: GuildBasedChannel) {
		const guild = await prisma.guild.findUnique({
			where: { guild:	channel.guild.id },
			select: { antiRaid: true }
		})

		if (!guild?.antiRaid) return;
		if (!channel.guild) return false;
		
		ChannelCreations.channels.push(channel.id)
		ChannelCreations.times++
		
		if (ChannelCreations.times >= 5) {
			const auditLogFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
			const log = auditLogFetch.entries.first()
			if (channel.client.user?.id === log?.executor?.id) return
			const member = await channel.guild.members.fetch(log?.executor?.id!)
			channel.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(async r => await member.roles.remove(r, "Creating too many channels").catch(async () => await r.setPermissions([], "Creating too many channels").catch(() => { })))
			ChannelCreations.channels.forEach(async c => await channel.guild.channels.cache.get(c)?.delete().catch(() => { }))

			const guild = await prisma.guild.findUnique({
				where: { guild: channel.guild.id },
				select: { logs: true }
			})
	
			const logs = channel.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for creating too many channels.`,
					reason: `Too many channels created.`,
				})
			)
		}

		setTimeout(() => {
			ChannelCreations.times = 0
			ChannelCreations.channels = []
		}, 8000)
	}
}