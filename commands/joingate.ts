import type { ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, errorEmbedBuilder, logBuilder, successEmbedBuilder } from '../utils.js';
import prisma from '../database.js';

export default class RaidMode {
	data = new SlashCommandBuilder()
		.setName('joingate')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDescription('Dont allow members to join your server')
		.addSubcommand(subcommand => subcommand.setName('on').setDescription('turn the join gate on!'))
		.addSubcommand(subcommand => subcommand.setName('off').setDescription('turn the join gate off!'));

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}

		try {
			await interaction.deferReply({ ephemeral: true });
			const adminsGuild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId },
				select: { admins: true },
			});
			if (!(adminsGuild?.admins?.includes(interaction.user.id) || interaction.user.id === interaction.guild?.ownerId)) {
				await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to toggle the join gate")] });
				return;
			}
			switch (interaction.options.getSubcommand()) {
				case 'on':
					const onGuild = await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { raidMode: true },
						create: {
							guild: interaction.guildId,
							raidMode: true,
						},
					});

					const onLogs = interaction.guild?.channels.cache.get(onGuild?.logs!) as TextChannel;
					await onLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							content: `Join gate has been activated by ${interaction.user}!`,
							reason: `Join gate feature has been activated by ${interaction.user.tag}`,
						})
					);
					await interaction.editReply({ embeds: [successEmbedBuilder('The Join Gate is now currently active.')] });
					break;

				case 'off':
					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId },
						select: { raidMode: true, logs: true },
					});

					if (!guild?.raidMode) {
						await interaction.editReply({ embeds: [errorEmbedBuilder('The Join Gate has not been activated in this server!')] });
						return;
					}

					await prisma.guild.update({
						where: { guild: interaction.guildId },
						data: { raidMode: false },
					});

					await interaction.editReply({ embeds: [successEmbedBuilder('The Join Gate is now currently off')] });

					const offLogs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
					await offLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							content: `Join gate has been deactivated by ${interaction.user}!`,
							reason: `Join gate feature has been deactivated by ${interaction.user.tag}`,
						})
					);
					break;
			}
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
