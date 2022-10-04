import type { CommandInteraction } from "discord.js";
import { Colors, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbedBuilder } from '../utils.js'
import prisma from '../database.js'

export default class AntiSpam {
  data = new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Show your configured settings!')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		await interaction.deferReply({ ephemeral: true });
		
		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId! },
			select: {
				raidMode: true,
				antiSpam: true,
				toxicityFilter: true,
				antiLinks: true,
				verificationChannel: true,
				logs: true,
				antiRaid: true,
				lockdownChannel: true
			}
		})
		
    const embed = new EmbedBuilder({
      title: '<:settings:1020748294542082078> Settings',
      description: `
${guild?.verificationChannel ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Verification
${guild?.logs ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Logs
${guild?.antiRaid ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Anti Raid
${guild?.raidMode ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Join Gate
${guild?.lockdownChannel ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Lockdown
${guild?.antiSpam ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Anti Spam
${guild?.toxicityFilter ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Toxicity Filter
${guild?.antiLinks ? '<:check:1008718056891101194>' : '<:error:1009134465995509810>'} Anti Links
	`,
      color: Colors.Blurple,
		})

		await interaction.editReply({ embeds: [embed] })
  }
}