import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default class Help {
	data = new SlashCommandBuilder()
		.setName('vote')
		.setNameLocalizations({ 'es-ES': 'votar' })
		.setDescription('Vote our bot to help us!')
		.setDescriptionLocalizations({ 'es-ES': 'Vota a nuestro bot para ayudarnos!' });

	async run(interaction: CommandInteraction) {
		const embed = new EmbedBuilder({
			title: '<:check:1027354811164786739> Vote Us!',
			description:
				'<:arrow:1027722692662673429> By voting us, you help us grow and protect more servers! Please take 1 minute of your time to help us get to more servers.',
			color: 0x2f3136,
		});

		const buttons = new ActionRowBuilder<ButtonBuilder>({
			components: [
				new ButtonBuilder({
					label: 'Top.gg',
					style: ButtonStyle.Link,
					url: 'https://top.gg/bot/1008400801628164096',
				}),
				new ButtonBuilder({
					label: 'Discord Bot List',
					style: ButtonStyle.Link,
					url: 'https://discord.ly/pyrite',
				}),
			],
		});

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}
}
