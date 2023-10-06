import type { GuildMember, TextChannel } from "discord.js";
import { EmbedBuilder, Events, PermissionFlagsBits } from "discord.js";
import { prisma } from "../database.js";

export default class {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild?.id },
			select: { logs: true, antiAlts: true },
		});

		if (!guild?.antiAlts) return;

		const logs = member.guild?.channels.cache.get(
			guild?.logs ?? "",
		) as TextChannel;

		const accAge = Math.abs(Date.now() - member.user.createdTimestamp);
		const accDays = Math.ceil(accAge / (1000 * 60 * 60 * 24));
		if (accDays <= 7) {
			const user = member.user;
			if (
				!member.guild?.members?.me?.permissions?.has(
					PermissionFlagsBits.KickMembers,
				)
			) {
				const errorEmbed = new EmbedBuilder({
					title: "Alt Account Detected!",
					description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
	        <:arrow:1068604670764916876> They were not kicked by the **Anti Alts system** because I don't have permission to kick members
	        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
						Date.now() / 1000,
					)}:R>`,
					thumbnail: {
						url: user.displayAvatarURL(),
					},
					color: 0x2b2d31,
				});

				await logs.send({ embeds: [errorEmbed] });
				return;
			}

			if (!member) return;

			try {
				await member.kick("Alt account");
			} catch {
				const errorEmbed = new EmbedBuilder({
					title: "Alt Account Detected!",
					description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
	        <:arrow:1068604670764916876> They were not kicked by the **Anti Alts system** because they had higher permitions that myself
	        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
						Date.now() / 1000,
					)}:R>`,
					thumbnail: {
						url: user.displayAvatarURL(),
					},
					color: 0x2b2d31,
				});

				await logs.send({ embeds: [errorEmbed] });
				return;
			}

			const embed = new EmbedBuilder({
				title: "Alt Account Detected!",
				description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
        <:arrow:1068604670764916876> They were kicked by the **Anti Alts system**
        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
					Date.now() / 1000,
				)}:R>`,
				thumbnail: {
					url: user.displayAvatarURL(),
				},
				color: 0x2b2d31,
			});

			await logs?.send({ embeds: [embed] });
		}
	}
}
