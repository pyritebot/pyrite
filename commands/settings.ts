import type { CommandInteraction } from "discord.js";
import { Colors, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbedBuilder } from '../utils.js'
import emojis from '../emojis.js'
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
				antiSpam: true,
				spamMinutes: true,
				spamMessageLimit: true,
				toxicityFilter: true,
				antiLinks: true,
				verificationChannel: true,
				members: true,
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
      description: `${emojis.reply1} Here are all of the configured settings below:`,
			fields: [
				{
					name: `${guild?.antiSpam ? emojis.check : emojis.error} __Anti Spam__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Spam Minutes:**  \`${guild?.spamMinutes}\`
          ${emojis.blank}${emojis.arrow} **Spam Message Limit:** \`${guild?.spamMessageLimit}\`
          `
				},
        {
        name: `${guild?.verificationChannel ? emojis.check : emojis.error} __Verification__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Verification Channel:** <#${guild?.verificationChannel}>
          ${emojis.blank}${emojis.arrow} **Verification Role:** <@&${guild?.members}>
          `
        },
        {
        name: `${guild?.logs ? check : error} __Logs__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Logs Channel:** <#${guild?.logs}>
          `
        },
        {
        name: `${guild?.toxicityFilter ? check : error} __Anti Toxicity__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Toxicity Logs Channel:** <#${guild?.logs}>
          `
        },
        {
        name: `${guild?.antiLinks ? check : error} __Anti Links__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Anti Links Log Channel:** <#${guild?.logs}>
          `
        },
        {
        name: `${guild?.antiRaid ? check : error} __Anti Raid__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Anti Raid Log Channel:** <#${guild?.logs}>
          ${emojis.blank}${emojis.arrow} **Channel Creation Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Channel Deletion Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Role Creation Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Role Deletion Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Punishment:** Quarantine
          `
        },
        {
        name: `${guild?.antiAlts ? check : error} __Anti Alts__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Anti Alts Log Channel:** <#${guild?.logs}>
          ${emojis.blank}${emojis.arrow} **Max Days:** \`7\`
          `
        },
        {
        name: `${guild?.lockdownChannel ? check : error} __Lockdown__` ,
          value: `
          ${emojis.blank}${emojis.arrow} **Lockdown Channel**: ${guild?.lockdownChannel ? `<#${guild?.lockdownChannel}>` : 'Not Set'}
          `
        },
        
			],
      color: 0x2b2d31,
      footer: {
	      text: interaction.guild?.name!,
				icon_url: interaction.guild?.iconURL()!,
	    }
		})

		await interaction.editReply({ embeds: [embed] })
  }
}