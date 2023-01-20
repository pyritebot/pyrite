import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { errorEmbedBuilder, optionButtons } from '../utils.js';

export default class Setup {
	data = new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup the Bot in this server!')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}

		const channel = await interaction.guild?.channels.create({
			name: 'setup-channel',
			permissionOverwrites: [
				{
					id: interaction.guildId,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.user.id,
					allow: [PermissionFlagsBits.ViewChannel],
				},
			],
		});

		await interaction.reply({ content: `Go to ${channel} to continue setting up the server!`, ephemeral: true });
		await channel?.send({ content: `${interaction.user}, I will walk you through the steps to set up ${interaction.client.user} in this server!` });
		const embed = new EmbedBuilder({
			title: ':no_entry_sign: Anti Spam',
			description: '> Would you like to use our effective spam system to stop members from spamming in your server?',
			color: 0x2f3136,
		});
		await channel?.send({ embeds: [embed], components: [optionButtons('antispam')] });
	}
}
