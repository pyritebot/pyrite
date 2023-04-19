import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder } from "../utils.js";
import prisma from "../database.js";

export default class AntiAlts {
	data = new SlashCommandBuilder()
		.setName("antialts")
		.setDescription(
			"Toggle Anti alts in your server (this will block every alt account that joins your server)!",
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand.setName("on").setDescription("turn anti alts on!"),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("off").setDescription("turn anti alts off!"),
		);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case "on":
				await prisma.guild.upsert({
					where: { guild: interaction.guildId },
					update: { antiAlts: true },
					create: { guild: interaction.guildId, antiAlts: true },
				});
				await interaction.editReply({
					embeds: [successEmbedBuilder("Anti Alts has been turned on!")],
				});
				break;

			case "off":
				await prisma.guild.upsert({
					where: { guild: interaction.guildId },
					update: { antiAlts: false },
					create: { guild: interaction.guildId, antiAlts: false },
				});
				await interaction.editReply({
					embeds: [successEmbedBuilder("Anti alts has been turned off!")],
				});
				break;
		}
	}
}
