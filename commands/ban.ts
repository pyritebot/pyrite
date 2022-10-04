import type { CommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, errorEmbedBuilder, successEmbedBuilder, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class Ban {
	data = new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans a user from the server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption(option => option.setName('user').setDescription('You can pass a mention or an id of a user.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('You can pass a string with a reason for banning the user of the server.').setRequired(true))

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		const member = interaction.options.getMember('user');
		const reason = interaction.options.getString('reason');

		if (!interaction.guild?.members?.me?.permissions?.has(PermissionFlagsBits.BanMembers)) {
			await interaction.reply({ embeds: [errorEmbedBuilder("The bot doesn't have permissions to ban members!")], ephemeral: true });
			return;
		}
		
		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder('Member could not be found!')], ephemeral: true });
			return;
		}

		try {
			await member.ban({ reason });
		} catch {
			await interaction.reply({ embeds: [errorEmbedBuilder('Cannot ban this member!')], ephemeral: true });
			return;
		}
    
		await interaction.reply({ embeds: [successEmbedBuilder(`${member.user} was banned from the server for ${reason}`)], ephemeral: true })

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: { logs: true },
		})

		const logs = interaction.guild.channels.cache.get(guild?.logs!)
		await logs?.send(logBuilder({
			member: interaction.member as Message,
			content: `${member.user} has been banned by ${interaction.user}!`,
			reason,
		}))
	}
}