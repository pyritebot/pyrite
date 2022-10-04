import type { Interaction, TextChannel, VoiceChannel } from "discord.js"
import { PermissionFlagsBits, Events, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { optionButtons, successEmbedBuilder } from "../utils.js";
import prisma from "../database.js";

export default class Setup {
  name = Events.InteractionCreate

  async run(interaction: Interaction) {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'antispam_yes') {
      await interaction.deferReply()
      await prisma.guild.upsert({
        where: { guild: interaction.guildId! },
        update: { antiSpam: true },
        create: { guild: interaction.guildId!, antiSpam: true },
      })
    } else if (interaction.customId === 'antispam_no') {
      await interaction.deferReply()
      await prisma.guild.update({
        where: { guild: interaction.guildId! },
        data: { antiSpam: false },
      })
    }

    if (interaction.customId === 'antispam_yes' || interaction.customId === 'antispam_no') {
      const embed = new EmbedBuilder({
        title: ':speech_balloon: Anti Toxicity',
        description: '> Ok, Would you like to use our effective anti toxicity system to mantain a PG-13 environment in the server?',
        color: Colors.Blurple,
      })

      await interaction.editReply({ embeds: [embed], components: [optionButtons('antitoxicity')] })
    }

    if (interaction.customId === 'antitoxicity_yes') {
      await interaction.deferReply()
      await prisma.guild.upsert({
        where: { guild: interaction.guildId! },
        update: { toxicityFilter: true },
        create: { guild: interaction.guildId!, toxicityFilter: true },
      })
    } else if (interaction.customId === 'antitoxicity_no') {
      await interaction.deferReply()
      await prisma.guild.update({
        where: { guild: interaction.guildId! },
        data: { toxicityFilter: false },
      })
    }

    if (interaction.customId === 'antitoxicity_yes' || interaction.customId === 'antitoxicity_no') {
      const embed = new EmbedBuilder({
        title: ':scroll: Logger',
        description: '> Nice!, Would you like to use the logger to know how your moderators use this bot?',
        color: Colors.Blurple,
      })

      await interaction.editReply({ embeds: [embed], components: [optionButtons('logger')] })
    }

    if (interaction.customId === 'logger_yes') {
      await interaction.deferReply()
      const logsChannel = await interaction.guild?.channels.create({
        name: 'logs',
        permissionOverwrites: [{
          id: interaction.guildId!,
          deny: [PermissionFlagsBits.ViewChannel]
        }]
      })
      await prisma.guild.upsert({
        where: { guild: interaction.guildId! },
        update: { logs: logsChannel?.id! },
        create: { guild: interaction.guildId!, logs: logsChannel?.id! },
      })
    } else if (interaction.customId === 'logger_no') {
      await interaction.deferReply()
      await prisma.guild.update({
        where: { guild: interaction.guildId! },
        data: { logs: null },
      })
    }

    if (interaction.customId === 'logger_yes' || interaction.customId === 'logger_no') {
      const embed = new EmbedBuilder({
        title: '<:check:1008718056891101194> Verification',
        description: '> Perfect!, Would you also like to set up verification in this server? (this will create a members role and verification channel, if you want to customize it use the `/verification` and `/whitelist` commands), please note that setting up verification will remove permissions from everyone role.',
        color: Colors.Blurple,
      })

      await interaction.editReply({ embeds: [embed], components: [optionButtons('verification')] })
    }

    if (interaction.customId === 'verification_yes') {
      await interaction.deferReply()
			
			interaction.guild?.roles.everyone.setPermissions([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseExternalEmojis], "Adding verification");

			const oldGuild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId! },
				select: { members: true },
			})

			if (!oldGuild?.members) {
				const role = await interaction.guild?.roles.create({
	        name: 'Members',
	      })
	
	      await prisma.guild.upsert({
	        where: { guild: interaction.guildId! },
	        update: { members: role?.id },
	        create: { guild: interaction.guildId!, members: role?.id },
	      })
			}

			const { members } = (await prisma.guild.findUnique({
				where: { guild: interaction.guildId! },
				select: { members: true },
			}))!

			const role = interaction.guild?.roles.cache.get(members!)
			role?.setPermissions([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.CreateInstantInvite,
				PermissionFlagsBits.ChangeNickname,
				PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.SendMessagesInThreads,
				PermissionFlagsBits.CreatePublicThreads,
				PermissionFlagsBits.CreatePrivateThreads,
				PermissionFlagsBits.EmbedLinks,
				PermissionFlagsBits.AttachFiles,
				PermissionFlagsBits.AddReactions,
				PermissionFlagsBits.UseExternalEmojis,
				PermissionFlagsBits.UseExternalStickers,
				PermissionFlagsBits.ReadMessageHistory,
				PermissionFlagsBits.UseApplicationCommands,
				PermissionFlagsBits.Connect,
				PermissionFlagsBits.Speak,
				PermissionFlagsBits.Stream,
				PermissionFlagsBits.UseEmbeddedActivities,
				PermissionFlagsBits.UseVAD,
			])

      const verificationChannel = await interaction.guild?.channels.create({
        name: 'verification',
        permissionOverwrites: [
          {
            id: interaction.guildId!,
						allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: members!,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      })

      const verificationButtons = new ActionRowBuilder<ButtonBuilder>({
      	components: [
          new ButtonBuilder({
            label: 'Verify',
            style: ButtonStyle.Primary,
            custom_id: 'verify'
          })
        ]
      })

      const verificationEmbed = new EmbedBuilder({
        title: '<:check:1008718056891101194> Verification',
        description: `<:1412reply:1009087336828649533> This server is protected by **Pyrite**, no one can gain access without completing a verification system.`,
        color: Colors.Blurple
      })

      await verificationChannel?.send({ embeds: [verificationEmbed], components: [verificationButtons] })

      await prisma.guild.upsert({
        where: { guild: interaction.guildId! },
        update: { verificationChannel: verificationChannel?.id },
        create: { guild: interaction.guildId!, verificationChannel: verificationChannel?.id },
      })
    }

    if (interaction.customId === 'verification_yes' || interaction.customId === 'verification_no') {
      const embed = new EmbedBuilder({
        title: '<:check:1008718056891101194> Anti Raid',
        description: '> Perfect!, would you like to activate the Anti Raid Sytem?',
        color: Colors.Blurple,
      })

      await interaction.editReply({ embeds: [embed], components: [optionButtons('antiraid')] })
    }

		if (interaction.customId === 'antiraid_yes') {
			await interaction.deferReply()
			await prisma.guild.upsert({
				where: { guild: interaction.guildId! },
				update: { antiRaid: true },
				create: { guild: interaction.guildId!, antiRaid: true }
			})
		}

		if (interaction.customId === 'antiraid_yes' || interaction.customId === 'antiraid_no') {
			await interaction.editReply({ embeds: [successEmbedBuilder('Setup completed! This channel will be deleted in 5 seconds.')] })

      setTimeout(async () => {
        await interaction.channel?.delete()
      }, 5000)
		}
  }
}