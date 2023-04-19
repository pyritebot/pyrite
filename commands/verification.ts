import type {
	ChatInputCommandInteraction,
	GuildMember,
	TextChannel,
	VoiceChannel,
} from "discord.js";
import {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	ChannelType,
} from "discord.js";
import {
	defaultError,
	errorEmbedBuilder,
	logBuilder,
	successEmbedBuilder,
	getQuarantine,
} from "../utils.js";
import prisma from "../database.js";

export default class Verification {
	data = new SlashCommandBuilder()
		.setName("verification")
		.setNameLocalizations({ "es-ES": "verificación" })
		.setDescription("Configure verification in your server!")
		.setDescriptionLocalizations({
			"es-ES": "¡Configura la verificación en tu servidor!",
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("on")
				.setNameLocalizations({ "es-ES": "en" })
				.setDescription(
					"Turn on verification and post embed in the specified channel!",
				)
				.setDescriptionLocalizations({
					"es-ES":
						'¡Enciende la verificación y publica el "embed" en el canal especificado!',
				})
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setNameLocalizations({ "es-ES": "canal" })
						.setDescription("The verification channel")
						.setDescriptionLocalizations({
							"es-ES": "El canal de verificación",
						})
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("off")
				.setNameLocalizations({ "es-ES": "apagada" })
				.setDescription("Turn off verification.")
				.setDescriptionLocalizations({ "es-ES": "Apagar la verificación" }),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("role")
				.setNameLocalizations({ "es-ES": "rol" })
				.setDescription("Set the role to be assigned once verified")
				.setDescriptionLocalizations({
					"es-ES": "Configura el rol que debe ser asignado una vez verificado!",
				})
				.addRoleOption((option) =>
					option
						.setName("role")
						.setNameLocalizations({ "es-ES": "rol" })
						.setDescription("role to be assigned once verified")
						.setDescriptionLocalizations({
							"es-ES": "rol que debe ser asignado una vez verificado",
						})
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("removerole")
				.setNameLocalizations({ "es-ES": "eliminar-rol" })
				.setDescription("Remove the role to be assigned once verified")
				.setDescriptionLocalizations({
					"es-ES": "Eliminar el role que debe ser asignado una vez verificado",
				}),
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

		await interaction.deferReply({ ephemeral: true });
		try {
			switch (interaction.options.getSubcommand()) {
				case "on":
					const channel = interaction.options.getChannel(
						"channel",
					) as TextChannel;

					if (channel?.type !== ChannelType.GuildText) {
						await interaction.editReply({
							embeds: [
								errorEmbedBuilder("The channel must be a Text Channel."),
							],
						});
						return;
					}

					// rome-ignore lint/style/noNonNullAssertion: Guild will always be defined, since this command doesn't allow you to run it in anything other than a guild.
					const quarantine = await getQuarantine(interaction.guild!);

					interaction.guild?.channels.cache.forEach(async (ch) => {
						const c = ch as TextChannel | VoiceChannel;
						await c.permissionOverwrites?.edit(quarantine, {
							ViewChannel: false,
						});
					});

					channel.permissionOverwrites.edit(quarantine, {
						ViewChannel: true,
						SendMessages: false,
					});
					channel.permissionOverwrites.edit(interaction.guildId, {
						ViewChannel: false,
					});

					const verificationButtons = new ActionRowBuilder<ButtonBuilder>({
						components: [
							new ButtonBuilder({
								label: "Verify",
								style: ButtonStyle.Success,
								custom_id: "verify",
							}),
							new ButtonBuilder({
								label: "Help",
								style: ButtonStyle.Link,
								url: "https://discord.gg/NxJzWWqhdQ",
							}),
						],
					});

					const verificationEmbed = new EmbedBuilder({
						title: "<:check:1027354811164786739> Verification",
						description: `<:blank:1008721958210383902> <:arrow:1068604670764916876> To access \`${interaction.guild?.name}\` you must complete the verification process. \n<:blank:1008721958210383902><:blank:1008721958210383902><:reply:1067159718646263910> Press on the **Verify** button below.`,
						color: 0x2b2d31,
					});

					await channel.send({
						embeds: [verificationEmbed],
						components: [verificationButtons],
					});
					await interaction.editReply({
						embeds: [
							successEmbedBuilder("Successfully activated verification!"),
						],
					});

					const guild = await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { verificationChannel: channel.id },
						create: {
							guild: interaction.guildId,
							verificationChannel: channel.id,
						},
						select: { logs: true },
					});

					const onLogs = interaction.guild?.channels.cache.get(
						guild?.logs ?? "",
					) as TextChannel;
					onLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							reason: `Verification turned on by ${interaction.user.tag}`,
						}),
					);
					break;

				case "off":
					const tempGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId },
						select: { verificationChannel: true, logs: true },
					});
					const tempChannel = interaction.guild?.channels?.cache?.get(
						tempGuild?.verificationChannel ?? "",
					);
					await tempChannel?.delete();
					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { verificationChannel: null },
						create: { guild: interaction.guildId },
					});
					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								"Successfully deactivated verification in this server!",
							),
						],
					});

					const offLogs = interaction.guild?.channels.cache.get(
						tempGuild?.logs ?? "",
					) as TextChannel;
					offLogs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							reason: `Verification turned off by ${interaction.user.tag}`,
						}),
					);
					break;

				case "role":
					const role = interaction.options.getRole("role");

					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { members: role?.id },
						create: {
							guild: interaction.guildId,
							members: role?.id,
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								`Successfully set the **Member** role as ${role}`,
							),
						],
					});
					break;

				case "removerole":
					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { members: null },
						create: {
							guild: interaction.guildId,
							members: null,
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder("Successfully removed the **Member** role"),
						],
					});
					break;
			}
		} catch (err) {
			await interaction.editReply(defaultError);
			console.error(err);
		}
	}
}
