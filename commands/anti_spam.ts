import {
	type ChatInputCommandInteraction,
	type GuildMember,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type TextChannel,
} from "discord.js";
import { prisma } from "../database.js";
import {
	defaultError,
	errorEmbedBuilder,
	logBuilder,
	successEmbedBuilder,
} from "../utils.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("antispam")
		.setDescription("Toggle Anti Spam in your server!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand.setName("on").setDescription("turn anti spam on!"),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("off").setDescription("turn anti spam off!"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("set")
				.setDescription("Set the different limits of the antispam filter")
				.addIntegerOption((option) =>
					option
						.setName("minutes")
						.setDescription(
							"You can pass an integer which will the determines the minutes of the mute",
						),
				)
				.addIntegerOption((option) =>
					option
						.setName("limit")
						.setDescription(
							"You can pass an integer which will the determines the amount of messages before a mute",
						),
				),
		);

	async run(interaction: ChatInputCommandInteraction) {
		try {
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
				case "on": {
					const onGuild = await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						select: {
							logs: true,
						},
						update: {
							antiSpam: true,
						},
						create: {
							guild: interaction.guildId,
							antiSpam: true,
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								"anti spam filter has been activated successfully!",
							),
						],
					});

					const onLogs = interaction.guild?.channels.cache.get(
						onGuild?.logs ?? "",
					) as TextChannel;
					await onLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							reason: `anti-spam feature has been activated by ${interaction.user.tag}`,
						}),
					);
					break;
				}

				case "off": {
					const offGuild = await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						select: {
							logs: true,
						},
						update: {
							antiSpam: false,
						},
						create: {
							guild: interaction.guildId,
							antiSpam: false,
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								"anti spam filter has been deactivated successfully!",
							),
						],
					});

					const offLogs = interaction.guild?.channels.cache.get(
						offGuild?.logs ?? "",
					) as TextChannel;
					await offLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							reason: `anti-spam feature has been deactivated by ${interaction.user.tag}`,
						}),
					);
					break;
				}

				case "set": {
					const minutes = interaction.options.getInteger("minutes");
					const limit = interaction.options.getInteger("limit");

					if (minutes) {
						const minGuild = await prisma.guild.upsert({
							where: {
								guild: interaction.guildId,
							},
							select: {
								logs: true,
							},
							update: {
								spamMinutes: minutes,
							},
							create: {
								guild: interaction.guildId,
								spamMinutes: minutes,
							},
						});

						const minLogs = interaction.guild?.channels.cache.get(
							minGuild?.logs ?? "",
						) as TextChannel;
						await minLogs?.send(
							logBuilder({
								member: interaction.member as GuildMember,
								reason: `anti-spam minutes has been changed by ${interaction.user.tag}`,
							}),
						);
					}

					if (limit) {
						const limitGuild = await prisma.guild.upsert({
							where: {
								guild: interaction.guildId,
							},
							select: {
								logs: true,
							},
							update: {
								spamMessageLimit: limit,
							},
							create: {
								guild: interaction.guildId,
								spamMessageLimit: limit,
							},
						});

						const limitLogs = interaction.guild?.channels.cache.get(
							limitGuild?.logs ?? "",
						) as TextChannel;
						await limitLogs?.send(
							logBuilder({
								member: interaction.member as GuildMember,
								reason: `anti-spam message limit has been changed by ${interaction.user.tag}`,
							}),
						);
					}

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								"Your settings have been saved successfully!",
							),
						],
					});
				}
			}
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
