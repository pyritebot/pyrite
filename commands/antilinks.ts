import type { CommandInteraction, Message } from "discord.js";
import { Colors, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class AntiSpam {
  data = new SlashCommandBuilder()
		.setName('antilinks')
		.setDescription('Toggle Anti Links in your server (this will block every self promotion link)!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
			subcommand
				.setName('on')
				.setDescription('turn anti links on!')
    )
    .addSubcommand(subcommand =>
			subcommand
				.setName('off')
				.setDescription('turn anti links off!')
		)


	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		await interaction.deferReply({ ephemeral: true });
		
		switch (interaction.options.getSubcommand()) {
			case 'on':
				const onGuild = await prisma.guild.upsert({
					where: { guild: interaction.guildId! },
					update: { antiLinks: true },
					create: { antiLinks: true, guild: interaction.guildId! }
				})
				
				await interaction.editReply({ embeds: [successEmbedBuilder('Anti Links has been turned on!')]})

				const onLogs = interaction.guild?.channels.cache.get(onGuild?.logs!)
				await onLogs?.send(logBuilder({
					member: interaction.member as Message,
					content: `Anti Links has been activated by ${interaction.user}!`,
					reason: `anti links feature has been activated by ${interaction.user.tag}`
				}))
        break;
				
			case 'off':
				const offGuild = await prisma.guild.upsert({
					where: { guild: interaction.guildId! },
					update: { antiLinks: false },
					create: { antiLinks: false, guild: interaction.guildId! }
				})

				const offLogs = interaction.guild?.channels.cache.get(offGuild?.logs!)
				await offLogs?.send(logBuilder({
					member: interaction.member as Message,
					content: `Anti Links has been deactivated by ${interaction.user}!`,
					reason: `anti links feature has been deactivated by ${interaction.user.tag}`
				}))
				
				await interaction.editReply({ embeds: [successEmbedBuilder('Anti Links has been turned off!')]})
				break;
		}
	}
}