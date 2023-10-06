import type { Role, TextChannel } from "discord.js";
import { AuditLogEvent, Events } from "discord.js";
import { prisma } from "../database.js";
import { getQuarantine, logBuilder } from "../utils.js";

export default class RoleDeletions {
	name = Events.GuildRoleDelete;

	static times = 0;
	static timeout = setTimeout(() => {
		RoleDeletions.times = 0;
	}, 8_000);

	async run(role: Role) {
		const guild = await prisma.guild.findUnique({
			where: { guild: role.guild.id },
			select: { antiRaid: true, logs: true },
		});

		if (!guild?.antiRaid) return;

		RoleDeletions.times++;
		RoleDeletions.timeout.refresh();

		if (RoleDeletions.times % 5 === 0) {
			const auditLogFetch = await role.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.RoleDelete,
			});
			const log = auditLogFetch.entries.first();

			if (role.client.user?.id === log?.executor?.id) return;

			const member = await role.guild.members.fetch(log?.executor?.id ?? "");
			const quarantine = await getQuarantine(role.guild);

			member.roles.cache
				.filter((r) => r.id !== role.guild.id)
				.forEach(async (r) => {
					await member.roles
						.remove(r, "Deleting too many roles")
						.catch(async () => {
							if (!member.user.bot) return;
							r?.setPermissions([]).catch(() => {});
						});
				});

			if (quarantine) {
				await member.roles.add(quarantine, "Deleting too many roles");
			}

			await member
				.timeout(1440 * 60_000, "Deleting too many roles")
				.catch(() => {});

			const logs = member.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					reason: "Too many roles deleting.",
				}),
			);
		}
	}
}
