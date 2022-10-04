import type { CommandInteraction, Message } from "discord.js";
import { Colors, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class AntiToxicity {
	data = new SlashCommandBuilder()
		.setName('antitoxicity')
		.setDescription('Add a toxicity filter to your server to keep a PG-13 environment.')
  	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
			subcommand
				.setName('on')
				.setDescription('Turn toxicity filter on!')
    )
    .addSubcommand(subcommand =>
			subcommand
				.setName('off')
				.setDescription('Turn toxicity filter off!')
		)

	async run(interaction: CommandInteraction) {
		try {
			if (!interaction.inGuild()) {
				await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
				return
			}
			
			await interaction.deferReply({ ephemeral: true })
			switch (interaction.options.getSubcommand()) {
				case 'on':
					const onGuild = await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						select: { logs: true },
						update: { toxicityFilter: true },
						create: {
							guild: interaction.guildId!,
							toxicityFilter: true,
						},
					})
          await interaction.editReply({ embeds: [successEmbedBuilder(`toxicity filter has been activated successfully!`)] })

					const onLogs = interaction.guild?.channels.cache.get(onGuild?.logs!)
					await onLogs?.send(logBuilder({
						member: interaction.member as Message,
						content: `Anti Toxicity has been activated by ${interaction.user}!`,
						reason: `anti toxicity feature has been activated by ${interaction.user.tag}`
					}))
          break;

				case 'off':
					const offGuild = await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						select: { logs: true },
						update: { toxicityFilter: false },
						create: {
							guild: interaction.guildId!,
							toxicityFilter: false,
						},
					})
          await interaction.editReply({ embeds: [successEmbedBuilder(`toxicity filter has been deactivated successfully!`)] })
					
					const offLogs = interaction.guild?.channels.cache.get(offGuild?.logs!)
					await offLogs?.send(logBuilder({
						member: interaction.member as Message,
						content: `Anti Toxicity has been deactivated by ${interaction.user}!`,
						reason: `anti toxicity feature has been deactivated by ${interaction.user.tag}`
					}))
          break;
			}
		} catch {
			await interaction.editReply(defaultError)
		}
	}
}