import type { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addWarn, errorEmbedBuilder } from '../utils.js'

export default class Warn {
	data = new SlashCommandBuilder()
		.setName('warn')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setDescription('Add a warn to a user! (alias to /warns add)')
		.addUserOption(option =>
			option.setName('member').setDescription('You can pass a mention or an id of a member.').setRequired(true)
		)
		.addStringOption(option =>
			option.setName('reason').setDescription('You must provide a reason for this warning').setRequired(true)
		)

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		await addWarn(interaction)
	}
}