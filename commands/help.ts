import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, Colors } from 'discord.js';
import { defaultError, buttons } from '../utils.js';

export default class Help {
	data = new SlashCommandBuilder()
		.setName('help')
		.setNameLocalizations({ 'es-ES': 'ayuda' })
		.setDescription('Display the help command.')
		.setDescriptionLocalizations({ 'es-ES': 'Mostrar el comando de ayuda (en inglés).' });

	async run(interaction: ChatInputCommandInteraction) {
		const helpEmbed = new EmbedBuilder({
			title: ':blue_book:  Help',
			description: `
Thanks for using Pyrite Bot, here you can see all of my commands!

<:blank:1008721958210383902> <:arrow:1027722692662673429> Im gonna help you keep your server safe from any raider or spammer. To fully set me up it is recommended looking at the categories below.

Click on __**Select Category**__ below to get started. 
<:blank:1008721958210383902> <:arrow:1027722692662673429> If you got any doubts join us in our [Support Server](https://discord.gg/NxJzWWqhdQ) \:)
`,
			color: 0x2f3136,
			footer: {
				text: 'Developed by AngelNext#6138 and eldi mindcrafter#4743',
				icon_url: interaction.client.user?.displayAvatarURL()!
			}
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
