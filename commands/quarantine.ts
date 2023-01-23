import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, Colors, PermissionFlagsBits } from 'discord.js';
import { successEmbedBuilder, getQuarantine } from '../utils.js';
import prisma from '../database.js'

export default class Quarantine {
	data = new SlashCommandBuilder()
		.setName('quarantine')
		.setNameLocalizations({ 'es-ES': 'quarentena' })
		.setDescription('Manage the quarantine!')
		.setDescriptionLocalizations({ 'es-ES': '¡Maneja la quarentena!' })
  	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setNameLocalizations({ 'es-ES': 'añadir' })
				.setDescription('Quarantine a user!')
				.setDescriptionLocalizations({ 'es-ES': '¡Pon en quarentena a un usuario!' })
				.addUserOption(option =>
					option
						.setName('user')
						.setNameLocalizations({ 'es-ES': 'usuario' })
						.setDescription('You can pass a mention or an id of a user.')
						.setDescriptionLocalizations({ 'es-ES': 'Puedes pasar una mención o un id de un usuario' })
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setNameLocalizations({ 'es-ES': 'removir' })
				.setDescription('Unquarantine a user!')
				.setDescriptionLocalizations({ 'es-ES': '¡Quita de la quarentena a un usuario!' })
				.addUserOption(option =>
					option
						.setName('user')
						.setNameLocalizations({ 'es-ES': 'usuario' })
						.setDescription('You can pass a mention or an id of a user.')
						.setDescriptionLocalizations({ 'es-ES': 'Puedes pasar una mención o un id de un usuario' })
						.setRequired(true)
				)
		)

	async run(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		
		const member = interaction.options.getMember('user', true) as GuildMember;
		const quarantine = await getQuarantine(interaction.guild!)
		
    switch (interaction.options.getSubcommand()) {
			case 'add':
				await member.roles.add(quarantine)

				member.roles.cache.forEach(async r => {
					await member.roles
						.remove(r, 'Quarantined this user')
						.catch(() => {  })
				})
				
				await interaction.editReply({ embeds: [successEmbedBuilder(`${member.user} has been quarantined!`)] })
        break;

      case 'remove':
				await member.roles.remove(quarantine)
				
				await interaction.editReply({ embeds: [successEmbedBuilder(`${member.user} has been unquarantined!`)] })
	      break;
		}
  }
}