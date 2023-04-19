import type { GuildBan, TextChannel } from "discord.js";
import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";

export default class BanAdd {
	name = Events.GuildBanAdd;

	static times = 0;
	static users: string[] = [];
	static timeout = setTimeout(() => {
		BanAdd.times = 0;
		BanAdd.users = [];
	}, 20_000);

	async run(ban: GuildBan) {
		const guild = await prisma.guild.findUnique({
			where: { guild: ban.guild.id },
			select: {
				antiRaid: true,
				logs: true,
				owners: true,
				admins: true,
			},
		});

		BanAdd.users.push(ban.user.id);
		BanAdd.times++;
		BanAdd.timeout.refresh();

		if (BanAdd.times % 5 === 0) {
			const auditLogFetch = await ban.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MemberBanAdd,
			});
			const log = auditLogFetch.entries.first();

			if (ban.client.user?.id === log?.executor?.id) return;

			const member = await ban.guild.members.fetch(log?.executor?.id ?? "");

			if (
				guild?.admins.includes(member.user.id) ||
				guild?.owners.includes(member.user.id) ||
				member.user.id === member.guild.ownerId
			)
				return;

			const quarantine = await getQuarantine(ban.guild);

			member.roles.cache
				.filter((r) => r.id !== ban.guild.id)
				.forEach(async (r) => {
					await member.roles
						.remove(r, "Banning too many users")
						.catch(async () => {
							if (!member.user.bot) return;
							r?.setPermissions([]).catch(() => {});
						});
				});

			await member.roles.add(quarantine, "Banning too many users");

			await member
				.timeout(1440 * 60_000, "Banning too many users")
				.catch(() => {});

			BanAdd.users.forEach(async (user) => {
				await ban.guild.members.unban(user).catch(() => {});
			});

			const logs = ban.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel | null;
			await logs?.send(
				logBuilder({
					member,
					reason: "Too many users banned",
					punished: true,
				}),
			);
		}
	}
}
