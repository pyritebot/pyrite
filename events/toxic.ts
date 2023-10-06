import type { Interaction } from "discord.js";
import { Events } from "discord.js";
import { prisma } from "../database.js";
import { errorEmbedBuilder } from "../utils.js";

export default class {
	name = Events.InteractionCreate;

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;

		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		const [_, memberId] = interaction.customId.split("-");
		const member = await interaction.guild?.members.fetch(memberId ?? "");

		if (!member) {
			await interaction.reply({
				embeds: [errorEmbedBuilder("The member is not in this server")],
				ephemeral: true,
			});
			return;
		}

		if (interaction.customId.startsWith("kick_toxic")) {
			await member.kick("toxicity levels higher than normal");
			await interaction.message.delete();
		} else if (interaction.customId.startsWith("ban_toxic")) {
			await member.ban({ reason: "toxicity levels higher than normal" });
			await interaction.message.delete();
		} else if (interaction.customId.startsWith("verify_toxic")) {
			const guild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId },
				select: { members: true },
			});

			const role = interaction.guild?.roles.cache.get(guild?.members ?? "");

			if (role) {
				await member?.roles?.add(role);
			}
			await interaction.message.delete();
		}
	}
}
