import type { CommandInteraction, Message } from "discord.js";
import { Colors, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class AntiToxicity {
  data = new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Turn on the anti raid feature')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('on')
        .setDescription('Turn on anti raid!')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('off')
        .setDescription('Turn off anti raid!')
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
						update: { antiRaid: true },
						create: { guild: interaction.guildId!, antiRaid: true },
					})
          await interaction.editReply({
            embeds: [successEmbedBuilder(`anti raid has been activated successfully!`)]
          })

					const onLogs = interaction.guild?.channels.cache.get(onGuild?.logs!)
					await onLogs?.send(logBuilder({
						member: interaction.member as Message,
						content: `Anti Raid has been activated by ${interaction.user}!`,
						reason: `anti raid features have been activated by ${interaction.user.tag}`
					}))
          break;

        case 'off':
					const offGuild = await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						update: { antiRaid: false },
						create: { guild: interaction.guildId!, antiRaid: false },
					})

					const offLogs = interaction.guild?.channels.cache.get(offGuild?.logs!)
					await offLogs?.send(logBuilder({
						member: interaction.member as Message,
						content: `Anti Raid has been deactivated by ${interaction.user}!`,
						reason: `anti raid features have been deactivated by ${interaction.user.tag}`
					}))
					
          await interaction.editReply({
            embeds: [successEmbedBuilder(`anti raid has been deactivated successfully!`)]
          })
          break;
      }
    } catch {
      await interaction.editReply(defaultError)
    }
  }
}