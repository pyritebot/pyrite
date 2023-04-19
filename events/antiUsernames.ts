import type { TextChannel, GuildMember } from "discord.js";
import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class AntiLinks {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { logs: true, antiLinks: true },
		});
		if (!guild?.antiLinks) return;
		const username = member.user.username;
		if (
			username.includes("discord.gg/") ||
			username.includes("dsc.gg/") ||
			username.includes(".gg/") ||
			username.includes("gg/") ||
			username.includes("discord.com/invite/")
		) {
			const logs = member.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
			await logs?.send(
				logBuilder({
					member,
					reason: "Self promote is not allowed in this server!",
				}),
			);
			await member.kick("self promote username");
		}
	}
}
