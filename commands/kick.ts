import type {
	ChatInputCommandInteraction,
	GuildMember,
	TextChannel,
} from "discord.js";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
	errorEmbedBuilder,
	successEmbedBuilder,
	warnEmbedBuilder,
	logBuilder,
} from "../utils.js";
import prisma from "../database.js";

export default class Kick {
	data = new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kicks a user from the server.")
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("You can pass a mention or an id of a user.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription(
					"You can pass a string with a reason for kicking the user of the server.",
				)
				.setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		const member = interaction.options.getMember("user") as GuildMember;
		const reason = interaction.options.getString("reason", true);

		if (
			!interaction.guild?.members?.me?.permissions?.has(
				PermissionFlagsBits.KickMembers,
			)
		) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder(
						"The bot doesn't have permissions to kick members!",
					),
				],
				ephemeral: true,
			});
			return;
		}

		if (!member) {
			await interaction.reply({
				embeds: [errorEmbedBuilder("Member could not be found!")],
				ephemeral: true,
			});
			return;
		}

		const msg = await member
			.send({
				embeds: [
					warnEmbedBuilder(
						`You have been kicked from **${interaction.guild.name}**!`,
					),
				],
			})
			.catch(() => {});

		try {
			await member.kick(reason);
		} catch {
			await interaction.reply({
				embeds: [errorEmbedBuilder("Cannot kick this member!")],
				ephemeral: true,
			});
			await msg?.edit({
				embeds: [
					warnEmbedBuilder(
						`${interaction.user} tried to kick you from **${interaction.guild.name}**!`,
					),
				],
			});
			return;
		}

		await interaction.reply({
			embeds: [
				successEmbedBuilder(
					`${member.user} was kicked from the server for ${reason}`,
				),
			],
			ephemeral: true,
		});

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: { logs: true },
		});

		const logs = interaction.guild.channels.cache.get(
			guild?.logs ?? "",
		) as TextChannel;
		await logs?.send(
			logBuilder({
				member: interaction.member as GuildMember,
				reason,
			}),
		);
	}
}
