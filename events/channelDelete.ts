import type { GuildBasedChannel, TextChannel } from "discord.js"
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";

export default class ChannelDeletions {
	name = Events.ChannelDelete
	
	static times = 0
	static timeout = setTimeout(() => {
		ChannelDeletions.times = 0
	}, 8_000)

	async run(channel: GuildBasedChannel) {
		const guild = await prisma.guild.findUnique({
			where: { guild: channel.guild.id },
			select: { antiRaid: true, logs: true }
		})

		if (!guild?.antiRaid) return;
		if (!channel.guild) return;
		
		ChannelDeletions.times++
		ChannelDeletions.timeout.refresh()
		
		if (ChannelDeletions.times % 5 === 0) {
			const auditLogFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
			const log = auditLogFetch.entries.first()
			
			if (channel.client.user?.id === log?.executor?.id) return;
			
			const member = await channel.guild.members.fetch(log?.executor?.id!)
			const quarantine = await getQuarantine(channel.guild)

			member.roles.cache
        .filter(r => r.id !== channel.guild.id)
				.forEach(async r => {
					await member.roles
						.remove(r, 'Deleting to many channels')
						.catch(async () => {
							if (!member.user.bot) return;
							r?.setPermissions([]).catch(() => {})
						})
				})
			
			await member.roles.add(quarantine, 'Deleting to many channels')

			await member
				.timeout(1440 * 60_000, 'Deleting too many channels')
				.catch(() => {})
	
			const logs = channel.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(
				logBuilder({
					member,
					reason: `Too many channels deleted.`,
					punished: true,
				})
			)
		}
	}
}