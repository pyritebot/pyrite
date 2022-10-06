import type { ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from '../utils.js';
import prisma from '../database.js';

export default class AntiRaid {
	data = new SlashCommandBuilder()
		.setName('antinsfw')
		.setDescription('Turn on the anti NSFW feature')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand => subcommand.setName('on').setDescription('Turn on anti NSFW!'))
		.addSubcommand(subcommand => subcommand.setName('off').setDescription('Turn off anti NSFW!'));

	async run(interaction: ChatInputCommandInteraction) {
		try {
			if (!interaction.inGuild()) {
				await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
				return;
			}

			await interaction.deferReply({ ephemeral: true });
			switch (interaction.options.getSubcommand()) {
				case 'on':
					interaction.editReply({ embeds: [successEmbedBuilder('anti NSFW has been activated!')], ephermal: true})
					break;

				case 'off':
					interaction.editReply({ embeds: [successEmbedBuilder('anti NSFW has been deactivated!')], ephermal: true})
					break;
			}
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
