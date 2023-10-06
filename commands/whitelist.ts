import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} from "discord.js";
import {
	defaultError,
	errorEmbedBuilder,
	successEmbedBuilder,
	emojis,
} from "../utils.js";
import { prisma } from "../database.js";

export default class Whitelist {
	data = new SlashCommandBuilder()
		.setName("whitelist")
		.setDescription("Manage the whitelist!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("mod")
				.setDescription("The default mod role!")
				.addRoleOption((option) =>
					option
						.setName("role")
						.setDescription("The default moderator role that will be set")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("admin")
				.setDescription("Give a user admin perms (dangerous)")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("The user that will be made an admin")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("owner")
				.setDescription("Add another owner to your server (very dangerous)")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("The user that will be made an admin")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("show").setDescription("The all whitelisted roles"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("remove")
				.setDescription(
					"Set a whitelist option to defaults or remove an admin/owner",
				)
				.addStringOption((option) =>
					option
						.setName("setting")
						.setDescription("What setting you wanna change")
						.addChoices(
							{
								name: "member",
								value: "member",
							},
							{
								name: "mod",
								value: "mod",
							},
							{
								name: "admin",
								value: "admin",
							},
							{
								name: "owner",
								value: "owner",
							},
						)
						.setRequired(true),
				)
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription(
							"What members you want to remove from admin/owner whitelist?",
						),
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
						"Only an owner can use the </whitelist:1014153355377004670>.",
					),
				],
				ephemeral: true,
			});
			return;
		}

		try {
			const role = interaction.options.getRole("role");
			await interaction.deferReply({ ephemeral: true });

			switch (interaction.options.getSubcommand()) {
				case "member":
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

				case "mod":
					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { mods: role?.id },
						create: {
							guild: interaction.guildId,
							mods: role?.id,
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								`Successfully set the **Moderator** role as ${role}`,
							),
						],
					});
					break;

				case "admin":
					const member = interaction.options.getMember("user") as GuildMember;

					const tempGuild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId },
						select: { admins: true },
					});

					if (!member) {
						await interaction.editReply({
							embeds: [errorEmbedBuilder("That user in not on this server!")],
						});
						return;
					}

					if (tempGuild?.admins?.includes(member.user.id)) {
						await interaction.editReply({
							embeds: [errorEmbedBuilder("Member is already an admin!")],
						});
						return;
					}

					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { admins: { push: member.id } },
						create: {
							guild: interaction.guildId,
							admins: [member.id],
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								`Successfully added ${member.user} as an **admin**!`,
							),
						],
					});
					break;

				case "owner":
					const owner = interaction.options.getMember("user") as GuildMember;

					const tempGuild2 = await prisma.guild.findUnique({
						where: { guild: interaction.guildId },
						select: { owners: true },
					});

					if (!owner) {
						await interaction.editReply({
							embeds: [errorEmbedBuilder("That user in not on this server!")],
						});
						return;
					}

					if (tempGuild2?.owners?.includes(owner.user.id)) {
						await interaction.editReply({
							embeds: [errorEmbedBuilder("Member is already an owner!")],
						});
						return;
					}

					await prisma.guild.upsert({
						where: { guild: interaction.guildId },
						update: { owners: { push: owner.id } },
						create: {
							guild: interaction.guildId,
							owners: [owner.id],
						},
					});

					await interaction.editReply({
						embeds: [
							successEmbedBuilder(
								`Successfully added ${owner.user} as an **owner**!`,
							),
						],
					});
					break;

				case "show":
					const NOT_SET = `${emojis.error} Not Set`;

					const guild = await prisma.guild.findUnique({
						where: {
							guild: interaction.guildId,
						},
						select: {
							members: true,
							mods: true,
							admins: true,
							owners: true,
						},
					});

					const showEmbed = new EmbedBuilder({
						title: `${emojis.list}  Whitelist`,
						fields: [
							{
								name: "__Members__",
								inline: true,
								value: `${emojis.reply1}${guild?.members ? `<@&${guild?.members}>` : NOT_SET
									}`,
							},
							{
								name: "__Mods__",
								inline: true,
								value: `${emojis.reply1}${guild?.mods ? `<@&${guild?.mods}>` : NOT_SET
									}`,
							},
							{
								name: "__Admins__",
								inline: true,
								value: `${emojis.reply1}${guild?.admins?.length
										? guild.admins.reduce(
											(acc, val) => acc.concat(`<@${val}>\n`),
											"",
										)
										: NOT_SET
									}`,
							},
							{
								name: "__Owners__",
								inline: true,
								value: `${emojis.reply1}${guild?.owners?.length
										? guild.owners.reduce(
											(acc, val) => acc.concat(`<@${val}>\n`),
											"",
										)
										: NOT_SET
									}`,
							},
						],
						color: 0x2b2d31,
						footer: {
							text: interaction.guild?.name ?? "",
							icon_url: interaction.guild?.iconURL() ?? "",
						},
					});

					await interaction.editReply({ embeds: [showEmbed] });
					break;

				case "remove":
					const setting = interaction.options.getString("setting");
					switch (setting) {
						case "member":
							await prisma.guild.upsert({
								where: { guild: interaction.guildId },
								update: { members: null },
								create: { guild: interaction.guildId, members: null },
							});

							await interaction.editReply({
								embeds: [
									successEmbedBuilder(
										"Successfully reset member role to default!",
									),
								],
							});
							break;

						case "mod":
							await prisma.guild.upsert({
								where: { guild: interaction.guildId },
								update: { mods: null },
								create: { guild: interaction.guildId, mods: null },
							});

							await interaction.editReply({
								embeds: [
									successEmbedBuilder(
										"Successfully reset mod role to default!",
									),
								],
							});
							break;

						case "admin":
							const member = interaction.options.getMember(
								"user",
							) as GuildMember;

							const tempGuild = await prisma.guild.findUnique({
								where: { guild: interaction.guildId },
								select: { admins: true },
							});

							if (!tempGuild?.admins?.length) {
								await interaction.editReply({
									embeds: [errorEmbedBuilder("No admins in this server")],
								});
								return;
							}

							if (!member) {
								await interaction.editReply({
									embeds: [
										errorEmbedBuilder("That user in not on this server!"),
									],
								});
								return;
							}

							const newAdmins = tempGuild?.admins?.filter(
								(admin) => admin !== member?.user?.id,
							);

							if (
								JSON.stringify(tempGuild?.admins) === JSON.stringify(newAdmins)
							) {
								await interaction.editReply({
									embeds: [errorEmbedBuilder("That user is not an admin!")],
								});
								return;
							}

							await prisma.guild.upsert({
								where: { guild: interaction.guildId },
								update: { admins: newAdmins },
								create: { guild: interaction.guildId },
							});

							await interaction.editReply({
								embeds: [
									successEmbedBuilder(
										`Successfully removed ${member.user} as an admin!`,
									),
								],
							});
							break;

						case "owner":
							const owner = interaction.options.getMember(
								"user",
							) as GuildMember;

							const tempGuild2 = await prisma.guild.findUnique({
								where: { guild: interaction.guildId },
								select: { owners: true },
							});

							if (!tempGuild2?.owners?.length) {
								await interaction.editReply({
									embeds: [errorEmbedBuilder("No admins in this server")],
								});
								return;
							}

							if (!owner) {
								await interaction.editReply({
									embeds: [
										errorEmbedBuilder("That user in not on this server!"),
									],
								});
								return;
							}

							const newOwners = tempGuild2?.owners?.filter(
								(o) => o !== owner?.user?.id,
							);

							if (
								JSON.stringify(tempGuild2?.owners) === JSON.stringify(newOwners)
							) {
								await interaction.editReply({
									embeds: [errorEmbedBuilder("That user is not an admin!")],
								});
								return;
							}

							await prisma.guild.upsert({
								where: { guild: interaction.guildId },
								update: { owners: newOwners },
								create: { guild: interaction.guildId },
							});

							await interaction.editReply({
								embeds: [
									successEmbedBuilder(
										`Successfully removed ${owner?.user} as an owner!`,
									),
								],
							});
							break;
					}
			}
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
