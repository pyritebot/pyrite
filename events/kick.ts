import type { GuildMember, TextChannel } from "discord.js";
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";

export default class Kick {
	name = Events.GuildMemberRemove;

	static times = 0;
	static timeout = setTimeout(() => {
		Kick.times = 0;
	}, 8_000);

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { antiRaid: true, logs: true },
		});

		if (!guild?.antiRaid) return;

		Kick.times++;
		Kick.timeout.refresh();

		if (Kick.times % 5 === 0) {
			const auditLogFetch = await member.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MemberKick,
			});
			const log = auditLogFetch.entries.first();

			if (!log) return;
			if (log.createdAt < (member.joinedAt ?? new Date())) return;
			if (log.target?.id !== member.id) return;

			if (member.client.user?.id === log.executor?.id) return;

			const executor = await member.guild.members.fetch(
				log?.executor?.id ?? "",
			);
			const quarantine = await getQuarantine(member.guild);

			executor.roles.cache
				.filter((r) => r.id !== member.guild.id)
				.forEach(async (r) => {
					await executor.roles
						.remove(r, "Kicking too many users")
						.catch(async () => {
							if (!executor.user.bot) return;
							r?.setPermissions([]).catch(() => {});
						});
				});

			if (quarantine) {
				await executor.roles.add(quarantine, "Kicking too many users");
			}

			await executor
				.timeout(1440 * 60_000, "Kicking too many users")
				.catch(() => {});

			const logs = member.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					reason: "Too many users kicked.",
				}),
			);
		}
	}
}
