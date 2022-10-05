import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, successEmbedBuilder, errorEmbedBuilder } from '../utils.js';
import prisma from '../database.js';

export default class AntiSpam {
	data = new SlashCommandBuilder()
		.setName('antispam')
		.setDescription('Toggle Anti Spam in your server!')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand => subcommand.setName('on').setDescription('turn anti spam on!'))
		.addSubcommand(subcommand => subcommand.setName('off').setDescription('turn anti spam off!'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('minutes')
				.setDescription('How many minutes will the spammer be muted, default is 5')
				.addIntegerOption(option =>
					option.setName('minutes').setDescription('You can pass an integer which will the determines the minutes of the mute').setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('limit')
				.setDescription('How many messages will the spammer have to send before being muted, default is 7')
				.addIntegerOption(option =>
					option
						.setName('limit')
						.setDescription('You can pass an integer which will the determines the amount of messages before a mute')
						.setRequired(true)
				)
		);

	async run(interaction: ChatInputCommandInteraction) {
		try {
			if (!interaction.inGuild()) {
				await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
				return;
			}

			await interaction.deferReply({ ephemeral: true });

			switch (interaction.options.getSubcommand()) {
				case 'on':
					await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						update: {
							antiSpam: true,
						},
						create: {
							guild: interaction.guildId,
							antiSpam: true,
						},
					});
					await interaction.editReply({ embeds: [successEmbedBuilder(`anti spam filter has been activated successfully!`)] });
					break;

				case 'off':
					await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						update: {
							antiSpam: false,
						},
						create: {
							guild: interaction.guildId,
							antiSpam: false,
						},
					});
					await interaction.editReply({ embeds: [successEmbedBuilder(`anti spam filter has been deactivated successfully!`)] });
					break;

				case 'minutes':
					const minutes = interaction.options.getInteger('minutes', true);

					await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						update: {
							spamMinutes: minutes,
						},
						create: {
							guild: interaction.guildId,
							spamMinutes: minutes,
						},
					});

					await interaction.editReply({ embeds: [successEmbedBuilder(`Changed timeout time to ${minutes} minutes`)] });
					break;

				case 'limit':
					const limit = interaction.options.getInteger('limit', true);

					await prisma.guild.upsert({
						where: {
							guild: interaction.guildId,
						},
						update: {
							spamMessageLimit: limit,
						},
						create: {
							guild: interaction.guildId,
							spamMessageLimit: limit,
						},
					});

					await interaction.editReply({ embeds: [successEmbedBuilder(`Changed message limit to ${limit}!`)] });
					break;
			}
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
