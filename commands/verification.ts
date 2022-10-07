import type { ChatInputCommandInteraction, GuildMember, TextChannel, VoiceChannel } from 'discord.js';
import {
	SlashCommandBuilder,
	EmbedBuilder,
	Colors,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	ChannelType,
} from 'discord.js';
import { defaultError, errorEmbedBuilder, logBuilder, successEmbedBuilder } from '../utils.js';
import prisma from '../database.js';

export default class Verification {
	data = new SlashCommandBuilder()
		.setName('verification')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setDescription('Set verification in your server and configure it!')
		.addSubcommand(subcommand =>
			subcommand
				.setName('on')
				.setDescription('Turn on verification.')
				.addChannelOption(option => option.setName('channel').setDescription('The verification channel').setRequired(true))
		)
		.addSubcommand(subcommand => subcommand.setName('off').setDescription('Turn off verification.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('role')
				.setDescription('Add the role to be assigned once verified')
				.addRoleOption(option =>
					option.setName('role').setDescription('role to be assigned once verified').setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('removerole')
				.setDescription('Remove the role to be assigned once verified')
		);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}

		await interaction.deferReply({ ephemeral: true });
		try {
			switch (interaction.options.getSubcommand()) {
				case 'on':
					const channel = interaction.options.getChannel('channel') as TextChannel;

					if (channel?.type !== ChannelType.GuildText) {
						await interaction.editReply({ embeds: [errorEmbedBuilder('The channel must be a Text Channel.')] });
						return;
					}

					const oldGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { quarantine: true },
					});

					if (!interaction.guild?.roles.cache.get(oldGuild?.quarantine!)) {
						const role = await interaction.guild?.roles?.create({
							name: 'Quarantine',
						});

						role?.setPermissions([]);

						await prisma.guild.upsert({
							where: { guild: interaction.guildId! },
							update: { quarantine: role?.id!, verificationChannel: channel.id },
							create: {
								guild: interaction.guildId!,
								quarantine: role?.id!,
								verificationChannel: channel.id,
							},
						});
					}

					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { quarantine: true, logs: true },
					});

					interaction.guild?.channels.cache.forEach(async ch => {
						const c = ch as TextChannel | VoiceChannel;
						const quarantine = interaction.guild?.roles.cache.get(guild?.quarantine!);
						await c.permissionOverwrites?.edit(quarantine!, { ViewChannel: false })
					});

					channel.permissionOverwrites.edit(guild?.quarantine!, { ViewChannel: true, SendMessages: false });
					channel.permissionOverwrites.edit(interaction.guildId!, { ViewChannel: false });

					const verificationButtons = new ActionRowBuilder<ButtonBuilder>({
						components: [
							new ButtonBuilder({
								label: 'Verify',
								style: ButtonStyle.Success,
								custom_id: 'verify',
							}),
							new ButtonBuilder({
								label: 'Help',
								style: ButtonStyle.Link,
								url: 'https://discord.gg/NxJzWWqhdQ',
							}),
						],
					});

					const verificationEmbed = new EmbedBuilder({
						title: '<:check:1027354811164786739> Verification',
						description: `<:blank:1008721958210383902> <:arrow:1027722692662673429> To access \`${interaction.guild?.name}\` you must complete the verification process. \n<:blank:1008721958210383902><:blank:1008721958210383902><:1412reply:1009087336828649533> Press on the **Verify** button below.`,
						color: Colors.Green,
					});

					await channel.send({ embeds: [verificationEmbed], components: [verificationButtons] });
					await interaction.editReply({
						embeds: [successEmbedBuilder(`Successfully activated verification!`)],
					});

					const onLogs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
					onLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							content: `${interaction.user} has turned verification on!`,
							reason: `Verification turned on by ${interaction.user.tag}`,
						})
					);
					break;

				case 'off':
					const tempGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { verificationChannel: true, logs: true },
					});
					const tempChannel = interaction.guild?.channels?.cache?.get(tempGuild?.verificationChannel!);
					await tempChannel?.delete();
					await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						update: { verificationChannel: null },
						create: { guild: interaction.guildId! },
					});
					await interaction.editReply({ embeds: [successEmbedBuilder('Successfully deactivated verification in this server!')] });

					const offLogs = interaction.guild?.channels.cache.get(tempGuild?.logs!) as TextChannel;
					offLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							content: `${interaction.user} has turned verification off!`,
							reason: `Verification turned off by ${interaction.user.tag}`,
						})
					);
					break;

				case 'role':
					const role = interaction.options.getRole('role')
					
					await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						update: { members: role?.id },
						create: {
							guild: interaction.guildId!,
							members: role?.id,
						},
					});

					await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully set the **Member** role as ${role}`)] });
					break;

				case 'removerole':
					await prisma.guild.upsert({
						where: { guild: interaction.guildId! },
						update: { members: null },
						create: {
							guild: interaction.guildId!,
							members: null,
						},
					});

					await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully removed the **Member** role`)] });
					break;
			}
		} catch (err) {
			await interaction.editReply(defaultError);
			console.error(err);
		}
	}
}
