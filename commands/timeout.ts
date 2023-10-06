import {
	type ChatInputCommandInteraction,
	type GuildMember,
	type TextChannel,
	SlashCommandBuilder,
	PermissionFlagsBits,
} from "discord.js";
import {
	errorEmbedBuilder,
	successEmbedBuilder,
	warnEmbedBuilder,
	logBuilder,
} from "../utils.js";
import { prisma } from "../database.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("timeout")
		.setDescription("Timeouts a user from the server.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("add")
				.setDescription("Timeout a user")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Select the user (or user id) to timeout them.")
						.setRequired(true),
				)
				.addIntegerOption((option) =>
					option
						.setName("minutes")
						.setDescription("The minutes the user will be timeouted for.")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("reason")
						.setDescription(
							"You can pass a string with a reason for timeouting the user.",
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("remove")
				.setDescription("Remove the timeout from a user!")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Select the user (or user id) to timeout them.")
						.setRequired(true),
				),
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

		if (
			!interaction.guild?.members?.me?.permissions?.has(
				PermissionFlagsBits.ModerateMembers,
			)
		) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder(
						"The bot doesn't have permissions to timeout members!",
					),
				],
				ephemeral: true,
			});
			return;
		}

		const member = interaction.options.getMember("user") as GuildMember;

		if (!member) {
			await interaction.reply({
				embeds: [errorEmbedBuilder("Member could not be found!")],
				ephemeral: true,
			});
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case "add":
				const minutes = interaction.options.getInteger("minutes", true);
				const reason = interaction.options.getString("reason", true);
				const msg = await member
					.send({
						embeds: [
							warnEmbedBuilder(
								`You have been timeouted in **${interaction.guild.name}**!`,
							),
						],
					})
					.catch(() => {});

				try {
					await member.timeout(minutes * 60_000, reason);
				} catch (err) {
					await interaction.reply({
						embeds: [errorEmbedBuilder(`${member.user} cannot be timeouted!`)],
						ephemeral: true,
					});
					await msg?.edit({
						embeds: [
							warnEmbedBuilder(
								`${interaction.user} tried to timeout you in **${interaction.guild.name}**!`,
							),
						],
					});
					return;
				}

				await interaction.reply({
					embeds: [
						successEmbedBuilder(`${member.user} was sucessfully timeouted.`),
					],
					ephemeral: true,
				});

				const onGuild = await prisma.guild.findUnique({
					where: { guild: interaction.guildId },
					select: { logs: true },
				});

				const onLogs = interaction.guild.channels.cache.get(
					onGuild?.logs ?? "",
				) as TextChannel;
				await onLogs?.send(
					logBuilder({
						member: interaction.member as GuildMember,
						reason,
					}),
				);
				break;

			case "remove":
				try {
					await member.timeout(null);
				} catch (err) {
					await interaction.reply({
						embeds: [
							errorEmbedBuilder(`${member.user} cannot be un-timeouted!`),
						],
						ephemeral: true,
					});
					return;
				}

				await interaction.reply({
					embeds: [
						successEmbedBuilder(`${member.user} was sucessfully un-timeouted.`),
					],
					ephemeral: true,
				});

				const offGuild = await prisma.guild.findUnique({
					where: { guild: interaction.guildId },
					select: { logs: true },
				});

				const offLogs = interaction.guild.channels.cache.get(
					offGuild?.logs ?? "",
				) as TextChannel;
				await offLogs?.send(
					logBuilder({
						member: interaction.member as GuildMember,
						reason: `Un-Timeouted ${member.user}`,
					}),
				);
				break;
		}
	}
}
