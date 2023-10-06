import type { GuildBasedChannel, TextChannel } from "discord.js";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import { prisma } from "../database.js";

export default class ChannelCreations {
	name = Events.ChannelCreate;

	static times = 0;
	static channels: string[] = [];
	static timeout = setTimeout(() => {
		ChannelCreations.times = 0;
	}, 8_000);

	async run(channel: GuildBasedChannel) {
		const guild = await prisma.guild.findUnique({
			where: { guild: channel.guild.id },
			select: { antiRaid: true, logs: true },
		});

		if (!guild?.antiRaid) return;
		if (!channel.guild) return;

		ChannelCreations.channels.push(channel.id);
		ChannelCreations.times++;
		ChannelCreations.timeout.refresh();

		if (ChannelCreations.times % 5 === 0) {
			const auditLogFetch = await channel.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.ChannelCreate,
			});
			const log = auditLogFetch.entries.first();

			if (channel.client.user?.id === log?.executor?.id) return;

			const member = await channel.guild.members.fetch(log?.executor?.id ?? "");
			const quarantine = await getQuarantine(channel.guild);

			member.roles.cache
				.filter((r) => r.id !== channel.guild.id)
				.forEach(async (r) => {
					await member.roles
						.remove(r, "Creating too many channels")
						.catch(async () => {
							if (!member.user.bot) return;
							r?.setPermissions([]).catch(() => {});
						});
				});

			await member.roles.add(quarantine, "Creating too many channels");

			await member
				.timeout(1440 * 60_000, "Creating too many channels")
				.catch(() => {});

			ChannelCreations.channels.forEach(async (c) => {
				await channel.guild.channels.cache
					.get(c)
					?.delete()
					?.catch(() => {});
			});

			const logs = channel.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					reason: "Too many channels created.",
					punished: true,
				}),
			);
		}
	}
}
