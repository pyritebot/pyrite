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

		const check = '<:check:1027354811164786739>'
		const error = '<:error:1027359606126690344>'
		const blank = '<:blank:1008721958210383902>'
		
    const embed = new EmbedBuilder({
      title: '<:settings:1028282277299503104>  Settings',
      description: `
${blank}${guild?.verificationChannel ? check : error} Verification
${blank}${guild?.logs ? check : error} Logs
${blank}${guild?.antiRaid ? check : error} Anti Raid
${blank}${guild?.raidMode ? check : error} Join Gate
${blank}${guild?.lockdownChannel ? check : error} Lockdown
${blank}${guild?.antiSpam ? check : error} Anti Spam
${blank}${guild?.toxicityFilter ? check : error} Toxicity Filter
${blank}${guild?.antiLinks ? check : error} Anti Links
	`,
      color: 0x2b2d31,
		})

		await interaction.editReply({ embeds: [embed] })
  }
}