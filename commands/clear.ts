import type { CommandInteraction, Message, TextChannel } from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, errorEmbedBuilder, successEmbedBuilder, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class Clear {
	data = new SlashCommandBuilder()
		.setName('clear')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDescription('Clear messages in a channel!')
		.addIntegerOption(amount => amount.setName('amount').setDescription('You can pass an integer up to 100').setRequired(true));

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		try {
			const amount = interaction.options.getInteger('amount');
			
			if (amount > 100) {
				await interaction.reply({ embeds: [errorEmbedBuilder('The amount should be equal or less than 100')], ephemeral: true })
				return;
			}
			
			const { size } = await interaction.channel?.bulkDelete(amount);
			await interaction.reply({ embeds: [successEmbedBuilder(`Successfully deleted **${size}** messages`)], ephemeral: true });

			const guild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId },
				select: { logs: true },
			})
	
			const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(logBuilder({
				member: interaction.member as Message,
				content: `${interaction.user} has cleared **${size}** messages in ${interaction.channel}!`,
				reason: `Bulk delete made by ${interaction.user.tag}`,
			}))
		} catch {
			await interaction.reply({ embeds: [errorEmbedBuilder('You can only delete messages that are less than 14 days old.')] })
		}
	}
}