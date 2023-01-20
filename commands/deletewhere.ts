import type { ChatInputCommandInteraction } from 'discord.js'
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { successEmbedBuilder, errorEmbedBuilder } from '../utils.js'
import prisma from '../database.js'

export default class DeleteWhere {
	data = new SlashCommandBuilder()
		.setName('delete')
		.setNameLocalizations({ 'es-ES': 'eliminar' })
		.setDescription('Deletes a channel/role with the specified name')
		.setDescriptionLocalizations({ 'es-ES': 'Elmina un canal/rol con el nombre especificado' })
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('where')
				.setNameLocalizations({ 'es-ES': 'donde' })
				.setDescription('Deletes a channel/role with the specified name')
				.setDescriptionLocalizations({ 'es-ES': 'Elmina un canal/rol con el nombre especificado' })
				.addStringOption(option => 
					option
						.setName('option')
						.setNameLocalizations({ 'es-ES': 'opción' })
						.setDescription('Select role or channel')
						.setDescriptionLocalizations({ 'es-ES': 'Selecciona rol o canal' })
						.setChoices(
							{
								name: 'role',
								value: 'role',
								name_localizations: { 'es-ES': 'rol' }
							},
							{
								name: 'channel',
								value: 'channel',
								name_localizations: { 'es-ES': 'canal' }
							},
						)
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('name')
						.setNameLocalizations({ 'es-ES': 'nombre' })
						.setDescription('Pass the name of the channels/roles you want to delete')
						.setDescriptionLocalizations({ 'es-ES': 'Pasa el nombre de los canales/roles que quieres borrar' })
						.setRequired(true)
				)
		)

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}
		
		const option = interaction.options.getString('option', true)
		const name = interaction.options.getString('name', true)

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId! },
			select: { owners: true }
		})

		if (!(guild?.owners.includes(interaction.user.id) || interaction.guild?.ownerId === interaction.user.id)) {
			await interaction.reply({ embeds: [errorEmbedBuilder('Only an owner can use the </delete where:1028257252978724904>.')], ephemeral: true });
			return;
		}
		
		await interaction.deferReply({ ephemeral: true })
		
		switch (option) {
			case 'role':
				interaction.guild?.roles.cache
					.filter(r => r.name === name)
					.forEach(async r => await r.delete(`Requested by ${interaction.user}!`).catch(() => {}))
				break;
					
			case 'channel':
				interaction.guild?.channels.cache
					.filter(c => c.name === name)
					.forEach(async c => await c.delete(`Requested by ${interaction.user}!`).catch(() => {}))
				break;
		}

		await interaction.editReply({ embeds: [successEmbedBuilder(`Deleted all ${option}s with name **${name}**`)] }).catch(() => {})
	}
}