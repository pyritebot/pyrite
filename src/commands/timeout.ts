import type { ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbedBuilder, successEmbedBuilder, logBuilder } from '../utils.js';
import prisma from '../database.js';

export default class Mute {
	data = new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeouts a user from the server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.addUserOption(option => option.setName('user').setDescription('Select the user (or user id) to timeout them.').setRequired(true))
		.addIntegerOption(option => option.setName('minutes').setDescription('The minutes the user will be timeouted for.').setRequired(true))
		.addStringOption(option =>
			option.setName('reason').setDescription('You can pass a string with a reason for timeouting the user.').setRequired(true)
		);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}

		const member = interaction.options.getMember('user') as GuildMember;
		const minutes = interaction.options.getInteger('minutes', true);
		const reason = interaction.options.getString('reason', true);

		if (!interaction.guild?.members?.me?.permissions?.has(PermissionFlagsBits.MuteMembers)) {
			await interaction.reply({ embeds: [errorEmbedBuilder("The bot doesn't have permissions to timeout members!")], ephemeral: true });
			return;
		}

		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder('Member could not be found!')], ephemeral: true });
			return;
		}

		try {
			await member.timeout(minutes * 60_000, reason);
		} catch (err) {
			await interaction.reply({ embeds: [errorEmbedBuilder(`${member.user} cannot be timeouted!`)], ephemeral: true });
			return;
		}

		await interaction.reply({ embeds: [successEmbedBuilder(`${member.user} was sucessfully timeouted.`)], ephemeral: true });

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: { logs: true },
		});

		const logs = interaction.guild.channels.cache.get(guild?.logs!) as TextChannel;
		await logs?.send(
			logBuilder({
				member: interaction.member as GuildMember,
				content: `${member.user} has been muted by ${interaction.user}!`,
				reason,
			})
		);
	}
}
