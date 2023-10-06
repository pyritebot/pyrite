import type { GuildMember } from "discord.js";
import { EmbedBuilder, Events } from "discord.js";
import { prisma } from "../database.js";
import { emojis } from "../utils.js";

export default class {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { raidMode: true },
		});

		if (!guild?.raidMode) return;

		const raidModeEmbed = new EmbedBuilder()
			.setDescription(
				`${emojis.arrow} **Join Gate** is currently active in this server. Meaning no one can join at the moment.`,
			)
			.setColor(0x2b2d31)
			.setAuthor({
				name: member.guild.name,
				iconURL: member.guild.iconURL() ?? "",
			});

		await member.send({ embeds: [raidModeEmbed] });
		await member.kick("Join Gate System");
	}
}
