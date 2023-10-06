import {
	type ChatInputCommandInteraction,
	type TextChannel,
	type VoiceChannel,
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	PermissionFlagsBits,
} from "discord.js";
import {
	defaultError,
	errorEmbedBuilder,
	successEmbedBuilder,
	emojis,
} from "../utils.js";
import { prisma } from "../database.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("lockdown")
		.setDescription("Lockdown the entire server!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand.setName("on").setDescription("turn the lockdown on!"),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("off").setDescription("turn the lockdown off!"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("update")
				.setDescription("Post an update on the lockdown!")
				.addStringOption((message) =>
					message
						.setName("message")
						.setDescription(
							"The update message that will be posted during lockdown",
						)
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

		const tempGuild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: { owners: true },
		});

		if (
			!(
				tempGuild?.owners.includes(interaction.user.id) ||
				interaction.guild?.ownerId === interaction.user.id
			)
		) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder(
						"Only an owner can use the </lockdown:1014153355330850855>.",
					),
				],
				ephemeral: true,
			});
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case "on":
				const confirm = new ActionRowBuilder<ButtonBuilder>({
					components: [
						new ButtonBuilder({
							label: "Continue",
							style: ButtonStyle.Danger,
							custom_id: "lockdown_continue",
						}),
					],
				});

				const lockdownOnEmbed = new EmbedBuilder()
					.setTitle(`${emojis.warn}  Warning!`)
					.setDescription(`${emojis.reply1} Lockdown will lock every channel in your server, and kick everyone new that joins to your server.
		 
					**__Note:__** We **aren't** responsible in any way for the damage this can cause to your server. Are you sure you want to continue?
					`)
					.setColor(0x2b2d31)
					.setFooter({
						text: interaction.guild?.name ?? "",
						iconURL: interaction.guild?.iconURL() ?? "",
					});

				await interaction.reply({
					embeds: [lockdownOnEmbed],
					components: [confirm],
					ephemeral: true,
				});
				break;

			case "off":
				try {
					await interaction.deferReply({ ephemeral: true });
					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId },
						select: {
							lockdownChannel: true,
							verificationChannel: true,
						},
					});

					if (!guild?.lockdownChannel) {
						await interaction.editReply({
							embeds: [
								errorEmbedBuilder(
									"Lockdown has not been activated in this server!",
								),
							],
						});
						return;
					}

					const lockdownChannel = await interaction.guild?.channels.fetch(
						guild?.lockdownChannel,
					);
					await lockdownChannel?.delete("Lockdown has been turned off");

					await prisma.guild.update({
						where: {
							guild: interaction.guildId,
						},
						data: {
							raidMode: false,
							lockdownChannel: null,
							lockdownMessage: null,
						},
					});

					interaction.guild?.channels.cache.forEach((ch) => {
						const c = ch as TextChannel | VoiceChannel;
						interaction.guild?.roles.cache.forEach(
							async (role) =>
								await c.permissionOverwrites.edit(role.id, {
									SendMessages: true,
								}),
						);
					});

					await interaction.editReply({
						embeds: [successEmbedBuilder("Lockdown is now off.")],
					});
				} catch {
					await interaction.editReply(defaultError);
				}
				break;

			case "update":
				const content = interaction.options.getString("message");

				await interaction.deferReply({ ephemeral: true });

				try {
					const guild = await prisma.guild.findUnique({
						where: {
							guild: interaction.guildId,
						},
						select: {
							lockdownMessage: true,
							lockdownChannel: true,
						},
					});

					if (!(guild?.lockdownChannel || guild?.lockdownMessage)) {
						await interaction.editReply({
							embeds: [
								errorEmbedBuilder(
									"lockdown has not been activated in this server!",
								),
							],
						});
						return;
					}

					const channel = interaction.guild?.channels.cache.get(
						guild?.lockdownChannel ?? "",
					) as TextChannel | VoiceChannel | null;
					const message = await channel?.messages?.fetch(
						guild?.lockdownMessage ?? "",
					);

					const embed = message?.embeds[0];

					const newEmbed = { ...embed?.data };
					newEmbed.fields ??= [];
					newEmbed.fields.push({
						name: `${emojis.arrow} Update #${(embed?.fields?.length ?? 0) + 1}`,
						value: `${emojis.blank} ${content}`,
					});
					newEmbed.timestamp = new Date().toISOString();

					await message?.edit({ embeds: [newEmbed] });
				} catch {
					await interaction.editReply(defaultError);
					break;
				}

				await interaction.editReply({
					embeds: [
						successEmbedBuilder("Successfully posted the lockdown update!"),
					],
				});
				break;
		}
	}
}
