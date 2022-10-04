import type { CommandInteraction, Message, TextChannel } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } from "discord.js";
import { defaultError, errorEmbedBuilder, logBuilder, successEmbedBuilder } from '../utils.js'
import prisma from '../database.js'

export default class Verification {
	data = new SlashCommandBuilder()
		.setName('verification')
  	.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setDescription('Set verification in your server and configure it!')
    .addSubcommand(subcommand =>
			subcommand
				.setName('on')
				.setDescription('Turn on verification.')
				.addChannelOption(option =>
					option.setName('channel').setDescription('The verification channel').setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('off')
				.setDescription('Turn off verification.')
		)
  
	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		await interaction.deferReply({ ephemeral: true });
		try {
			switch (interaction.options.getSubcommand()) {
				case 'on':
					const channel = interaction.options.getChannel('channel')

					if (channel.type !== ChannelType.GuildText) {
						await interaction.editReply({ embeds: [errorEmbedBuilder('The channel must be a Text Channel.')] })
						return;
					}
					
					interaction.guild?.roles.everyone.setPermissions([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseExternalEmojis], "Adding verification");
					
					const oldGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { members: true },
					})

					if (!oldGuild?.members) {
						const role = await interaction.guild?.roles?.create({
							name: 'Members',
						})

						await prisma.guild.upsert({
							where: { guild: interaction.guildId! },
							update: { members: role?.id, verificationChannel: channel.id },
							create: {
								guild: interaction.guildId!, 
								verificationChannel: channel.id,
							},
						})
					}

					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { members: true, logs: true },
					})

					channel.permissionOverwrites.edit(interaction.guildId!, { ViewChannel: true, SendMessages: false })
					channel.permissionOverwrites.edit(guild?.members, { ViewChannel: false })
					
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
					
          await channel.send({ embeds: [verificationEmbed], components: [verificationButtons] })
					await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully activated verification! (<@&${guild?.members}> will be assigned once user verifies!)`)] })

					const onLogs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
					onLogs?.send(
						logBuilder({
							member: interaction.member as Message,
							content: `${interaction.user} has turned verification on!`,
							reason: `Verification turned on by ${interaction.user.tag}`,
						})
					)
					break;
					
				case 'off':
					const tempGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { verificationChannel: true, logs: true },
					})
					const tempChannel = interaction.guild?.channels?.cache?.get(tempGuild?.verificationChannel!)
					await tempChannel?.delete()
					await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						update: { verificationChannel: null },
						create: { guild: interaction.guildId! },
					})
					await interaction.editReply({ embeds: [successEmbedBuilder('Successfully deactivated verification in this server!')] })

					const offLogs = interaction.guild?.channels.cache.get(tempGuild?.logs!) as TextChannel;
					offLogs?.send(
						logBuilder({
							member: interaction.member as Message,
							content: `${interaction.user} has turned verification off!`,
							reason: `Verification turned off by ${interaction.user.tag}`,
						})
					)
					break;
			}
		} catch (err) {
			await interaction.editReply(defaultError)
			console.error(err)
		}
	}
}