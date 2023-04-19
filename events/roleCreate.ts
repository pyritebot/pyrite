import type { Role, TextChannel } from "discord.js";
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";

export default class RoleCreations {
	name = Events.GuildRoleCreate;

	static times = 0;
	static roles: string[] = [];
	static timeout = setTimeout(() => {
		RoleCreations.times = 0;
		RoleCreations.roles = [];
	}, 5_000);

	async run(role: Role) {
		const guild = await prisma.guild.findUnique({
			where: { guild: role.guild.id },
			select: { antiRaid: true, logs: true },
		});

		if (!guild?.antiRaid) return;

		RoleCreations.roles.push(role.id);
		RoleCreations.times++;
		RoleCreations.timeout.refresh();

		if (RoleCreations.times % 5 === 0) {
			const auditLogFetch = await role.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.RoleCreate,
			});
			const log = auditLogFetch.entries.first();

			if (role.client.user?.id === log?.executor?.id) return;

			const member = await role.guild.members.fetch(log?.executor?.id ?? "");
			const quarantine = await getQuarantine(role.guild);

			member.roles.cache
				.filter((r) => r.id !== role.guild.id)
				.forEach(async (r) => {
					await member.roles
						.remove(r, "Creating too many roles")
						.catch(async () => {
							if (!member.user.bot) return;
							r?.setPermissions([]).catch(() => {});
						});
				});

			if (quarantine) {
				await member.roles.add(quarantine, "Creating too many roles");
			}

			await member
				.timeout(1440 * 60_000, "Creating too many roles")
				.catch(() => {});

			RoleCreations.roles.forEach(async (r) => {
				const rl = await role.guild.roles.fetch(r);
				await rl?.delete()?.catch(() => {});
			});

			const logs = member.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					reason: "Too many roles created.",
				}),
			);
		}
	}
}
