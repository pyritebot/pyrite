import type { GuildMember, TextChannel } from 'discord.js';
import { Events, AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import { logBuilder } from '../utils.js';
import prisma from '../database.js';

export default class Kick {
	name = Events.GuildMemberRemove;

	static times = 0;

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { antiRaid: true },
		});

		if (!guild?.antiRaid) return;

		Kick.times++;

		if (Kick.times >= 5) {
			const auditLogFetch = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
			const log = auditLogFetch.entries.first();
			if (!log) return;
			if (log.createdAt < member.joinedAt!) return;
			if (member.client.user?.id === log.executor?.id) return;
			const executor = await member.guild.members.fetch(log?.executor?.id!);
			executor.guild.roles.cache
				.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
				.forEach(
					async r =>
						await executor.roles
							.remove(r, 'Kicking too many users')
							.catch(async () => await r.setPermissions([], 'Kicking too many users').catch(() => {}))
				);

			const guild = await prisma.guild.findUnique({
				where: { guild: member.guild.id },
				select: { logs: true },
			});

			const logs = member.guild?.channels.cache.get(guild?.logs!) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					content: `${member.user} has been demoted for kicking too many users.`,
					reason: `Too many users kicked.`,
				})
			);
		}

		setTimeout(() => {
			Kick.times = 0;
		}, 8000);
	}
}
