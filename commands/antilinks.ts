import type {
	ChatInputCommandInteraction,
	GuildMember,
	TextChannel,
} from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
	successEmbedBuilder,
	errorEmbedBuilder,
	logBuilder,
} from "../utils.js";
import prisma from "../database.js";

export default class AntiLinks {
	data = new SlashCommandBuilder()
		.setName("antilinks")
		.setDescription(
			"Toggle Anti Links in your server (this will block every self promotion link)!",
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand.setName("on").setDescription("turn anti links on!"),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("off").setDescription("turn anti links off!"),
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
				const onGuild = await prisma.guild.upsert({
					where: { guild: interaction.guildId ?? "" },
					update: { antiLinks: true },
					create: { antiLinks: true, guild: interaction.guildId ?? "" },
				});

				await interaction.editReply({
					embeds: [successEmbedBuilder("Anti Links has been turned on!")],
				});

				const onLogs = interaction.guild?.channels.cache.get(
					onGuild?.logs ?? "",
				) as TextChannel;
				await onLogs?.send(
					logBuilder({
						member: interaction.member as GuildMember,
						reason: `anti links feature has been activated by ${interaction.user.tag}`,
					}),
				);
				break;

			case "off":
				const offGuild = await prisma.guild.upsert({
					where: { guild: interaction.guildId },
					update: { antiLinks: false },
					create: { antiLinks: false, guild: interaction.guildId },
				});

				const offLogs = interaction.guild?.channels.cache.get(
					offGuild?.logs ?? "",
				) as TextChannel;
				await offLogs?.send(
					logBuilder({
						member: interaction.member as GuildMember,
						reason: `anti links feature has been deactivated by ${interaction.user.tag}`,
					}),
				);

				await interaction.editReply({
					embeds: [successEmbedBuilder("Anti Links has been turned off!")],
				});
				break;
		}
	}
}
