import {
	type ChatInputCommandInteraction,
	type GuildMember,
	type PermissionResolvable,
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} from "discord.js";
import { errorEmbedBuilder, buttons, emojis } from "../utils.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("info")
		.setNameLocalizations({ "es-ES": "info" })
		.setDescription("Information about a server or a user.")
		.setDescriptionLocalizations({
			"es-ES": "Información sobre un servidor o un usuario",
		})
		.addSubcommand((subcommand) =>
			subcommand
				.setName("user")
				.setNameLocalizations({ "es-ES": "usuario" })
				.setDescription("Get information about a user")
				.setDescriptionLocalizations({
					"es-ES": "Encuentra información sobre un usuario",
				})
				.addUserOption((option) =>
					option
						.setName("user")
						.setNameLocalizations({ "es-ES": "usuario" })
						.setDescription("You can pass a mention or an id of a user.")
						.setDescriptionLocalizations({
							"es-ES": "Puedes pasar una mención o un id de un usuario",
						})
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("server")
				.setNameLocalizations({ "es-ES": "servidor" })
				.setDescription("Get information about a server")
				.setDescriptionLocalizations({
					"es-ES": "Encuentra información sobre un servidor",
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

		switch (interaction.options.getSubcommand()) {
			case "user":
				const member = interaction.options.getMember("user") as GuildMember;

				if (!member) {
					await interaction.reply({
						embeds: [
							errorEmbedBuilder(
								"The member you specified doesn't seem to exist, if this problem persists, please contact support",
							),
						],
						components: [buttons],
					});
					return;
				}

				const embed1 = new EmbedBuilder()
					.setTitle(`${emojis.compass} Who is ${member.user.tag}?`)
					.setThumbnail(member.user.displayAvatarURL())
					.setFields(
						{
							name: "__Name__",
							value: `${emojis.reply1}${member.user.username} [**\`${member.user.id}\`**]`,
						},
						{
							name: "__Account Creation__",
							value: `${emojis.reply1}<t:${
								Math.floor(member.user.createdTimestamp / 1000) + 3600
							}:R>`,
						},
						{
							name: "__Joined Server__",
							value: `${emojis.reply1}<t:${
								member.joinedTimestamp
									? Math.floor(member.joinedTimestamp / 1000)
									: "(No information available)"
							}:R>`,
						},
						{
							name: "__Permissions__",
							value: `${emojis.reply1}${Object.keys(PermissionFlagsBits)
								.map((perm) =>
									member.permissions.has(perm as PermissionResolvable)
										? `\`${perm}\``
										: "",
								)
								.filter((p) => p !== "")
								.join(", ")}`,
						},
						{
							name: "__Bot__",
							value: `${emojis.reply1}${member.user.bot}`,
						},
						{
							name: "__Roles__",
							value: `${emojis.reply1} ${[...member.roles.cache.values()]
								.filter((r) => r.name !== "@everyone")
								.join(", ")}`,
						},
					)
					.setFooter({
						text: `${member.user.tag} • ${member.user.id}`,
						iconURL: member.user.displayAvatarURL(),
					})
					.setTimestamp(new Date())
					.setColor(0x2b2d31);

				await interaction.reply({
					embeds: [embed1],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setLabel("Avatar")
								.setURL(member.user.displayAvatarURL())
								.setStyle(ButtonStyle.Link),
						),
					],
				});
				break;

			case "server":
				const embed2 = new EmbedBuilder()
					.setTitle(`${emojis.compass} ${interaction.guild?.name}`)
					.setThumbnail(interaction.guild?.iconURL() ?? null)
					.setFields(
						{
							name: "__Owner__",
							value: `${emojis.reply1}<@${interaction.guild?.ownerId}>`,
						},
						{
							name: "__Server Creation__",
							value: `${emojis.reply1}<t:${
								interaction.guild?.createdTimestamp
									? Math.floor(interaction.guild?.createdTimestamp / 1000)
									: "(No information available)"
							}:R>`,
						},
						{
							name: "__Server ID__",
							value: `${emojis.reply1}\`${interaction.guildId}\``,
						},
						{
							name: "__Member Count__",
							value: `${emojis.reply1}\`${interaction.guild?.memberCount}\``,
						},
						{
							name: "__Server Roles__",
							value: `${emojis.reply1}${[
								...(interaction.guild?.roles.cache.values() ?? []),
							]
								.filter((r) => r.name !== "@everyone")
								.join(", ")}`,
						},
						{
							name: "__Server Description__",
							value: `${emojis.reply1}${
								interaction.guild?.description ?? "(No description provided)"
							}`,
						},
					)
					.setTimestamp(new Date())
					.setFooter({
						text: `${interaction.guild?.name} • ${interaction.guildId}`,
						iconURL: interaction.guild?.iconURL() ?? undefined,
					})
					.setColor(0x2b2d31);

				await interaction.reply({ embeds: [embed2] });
				break;
		}
	}
}
