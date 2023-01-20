import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, Colors, PermissionFlagsBits } from 'discord.js';
import { successEmbedBuilder, errorEmbedBuilder } from '../utils.js';
import cuid from 'cuid';
import prisma from '../database.js'

export default class Help {
	data = new SlashCommandBuilder()
		.setName('modnick')
		.setNameLocalizations({ 'es-ES': 'moderar-apodo' })
		.setDescription('Moderate a users name to a pingable one!')
		.setDescriptionLocalizations({ 'es-ES': 'Cambia el nombre de usuario a uno al que se le pueda hacer ping!' })
  	.setDefaultMemberPermissions(PermissionFlagsBits.ChangeNickname)
  	.addUserOption(option =>
			option
				.setName('user')
				.setNameLocalizations({ 'es-ES': 'usuario' })
				.setDescription('You can pass a mention or an id of a user.')
				.setDescriptionLocalizations({ 'es-ES': 'Puedes pasar una mención o un id de un usuario' })
				.setRequired(true)
		);

	async run(interaction: ChatInputCommandInteraction) {
		const member = interaction.options.getMember('user', true)

		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder('That user is not on this server!')] })
			return;
		}

		if (!interaction.guild?.members?.me?.permissions?.has(PermissionFlagsBits.ChangeNickname)) {
			await interaction.reply({ embeds: [errorEmbedBuilder("The bot doesn't have permissions to change member's nicknames!")], ephemeral: true });
			return;
		}

		await interaction.deferReply({ ephemeral: true })
		
		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId! },
			select: { admins: true, owners: true }
		})

		if (guild?.owners.includes(member.user.id) || guild?.admins.includes(member.user.id) || interaction.guild?.ownerId === member.user.id) {
			await interaction.editReply({ embeds: [errorEmbedBuilder("You can't moderate an Admin's username")] });
			return;
		}
		
		try {
			await member.setNickname(`Moderated Nickname ${cuid().slice(0, 6)}`, 'Username was not pingable!')
		} catch {
			await interaction.editReply({ embeds: [errorEmbedBuilder("Can't moderate this user")] });
			return;
		}
		
		await interaction.editReply({ embeds: [successEmbedBuilder(`Moderated ${member}'s username!`)] });
	}
}
