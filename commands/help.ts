import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, Colors } from 'discord.js';
import { defaultError, buttons } from '../utils.js';

export default class Help {
	data = new SlashCommandBuilder()
		.setName('help')
		.setNameLocalizations({ 'es-ES': 'ayuda' })
		.setDescription('Display the help command!')
		.setDescriptionLocalizations({ 'es-ES': 'Mostrar el comando de ayuda (en inglés)' });

	async run(interaction: ChatInputCommandInteraction) {
		const helpEmbed = new EmbedBuilder({
			title: '<:pyrite:1014918476982394891> Pyrite Bot',
			description:
				'<:1412reply:1009087336828649533> Welcome to **Pyrite Bot** heres a list of my features below. If you need help using any scroll down in the select menu for them.',
			fields: [
				{ name: '<:moderator:1008717826552504321> Moderation', value: '<:1412reply:1009087336828649533> Advanced moderation system.' },
				{ name: '<:check:1008718056891101194> Verification', value: '<:1412reply:1009087336828649533> Advanced verification system.' },
				{ name: '<:staff:1008719693827285002> Whitelisting', value: '<:1412reply:1009087336828649533> Advanced whitelist system.' },
				{ name: '<:ban:1020333545887113246> Anti Raid', value: '<:1412reply:1009087336828649533> Advanced Anti Raid system.' },
				{ name: '<:muted:1010127791070658570> AutoMod', value: '<:1412reply:1009087336828649533> Advanced AutoMod system.' },
			],
			color: Colors.Blurple,
		});

		const row = new ActionRowBuilder<SelectMenuBuilder>({
			components: [
				new SelectMenuBuilder({
					custom_id: 'help_select',
					placeholder: 'Select Category',
					options: [
						{
							label: 'Start',
							emoji: '<:home:1010265828446457996>',
							description: 'Go back to the start.',
							value: 'start',
						},
						{
							label: 'Moderation',
							emoji: '<:moderator:1008717826552504321>',
							description: 'Get a list of the moderation commands.',
							value: 'moderation',
						},
						{
							label: 'Verification',
							emoji: '<:check:1008718056891101194>',
							description: 'Get a list of the verification commands.',
							value: 'verification',
						},
						{
							label: 'Whitelisting',
							emoji: '<:staff:1008719693827285002>',
							description: 'Get a list of the whitelist commands.',
							value: 'whitelisting',
						},
						{
							label: 'Anti Raid',
							emoji: '<:ban:1020333545887113246>',
							description: 'Get a list of the Anti Raid commands.',
							value: 'antiraid',
						},
						{
							label: 'AutoMod',
							emoji: '<:muted:1010127791070658570>',
							description: 'Get a list of the AutoMod commands.',
							value: 'automod',
						},
					],
				}),
			],
		});

		try {
			await interaction.reply({ embeds: [helpEmbed], components: [row, buttons], ephemeral: true });
		} catch {
			await interaction.reply(defaultError);
		}
	}
}
