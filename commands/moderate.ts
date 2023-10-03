import type { ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import {
	SlashCommandBuilder,
	EmbedBuilder,
	Colors,
	PermissionFlagsBits,
} from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder, buttons, logBuilder } from "../utils.js";
import { nanoid } from "nanoid/non-secure";
import prisma from "../database.js";

export default class Moderate {
	data = new SlashCommandBuilder()
		.setName("modnick")
		.setNameLocalizations({ "es-ES": "moderar-apodo" })
		.setDescription("Moderate a users name to one that can be mentioned!")
		.setDescriptionLocalizations({
			"es-ES":
				"Cambia el nombre de usuario a uno que pueda ser mencionado!",
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
		.addUserOption((option) =>
			option
				.setName("user")
				.setNameLocalizations({ "es-ES": "usuario" })
				.setDescription("You can pass a mention or an id of a user.")
				.setDescriptionLocalizations({
					"es-ES": "Puedes pasar una mención o un id de un usuario",
				})
				.setRequired(true),
		);

	async run(interaction: ChatInputCommandInteraction) {
		const member = interaction.options.getMember("user") as GuildMember;

		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		if (!member) {
			await interaction.reply({
				embeds: [errorEmbedBuilder("That user is not on this server!")],
			});
			return;
		}

		if (
			!interaction.guild?.members?.me?.permissions?.has(
				PermissionFlagsBits.ManageNicknames,
			)
		) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder(
						"The bot doesn't have permissions to manage member's nicknames!",
					),
				],
				ephemeral: true,
			});
			return;
		}

		try {
			await member.setNickname(
				`Moderated ${nanoid(12)}`,
				"Username/Nickname could not be mentioned",
			);

			await interaction.reply({
				embeds: [successEmbedBuilder(`Moderated ${member}'s username!`)],
				ephemeral: true,
			});

			const guild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId },
				select: { logs: true },
			});
	
			const logs = interaction.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel;
		
			logs?.send(
				logBuilder({
					member: interaction.member as GuildMember,
					reason: `${member.user} nickname moderated`,
				}),
			);

		} catch {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("Can't moderate this user's nickname, if this problem persists, please contact support")
				],
				components: [buttons],
				ephemeral: true,
			});
		}
	}
}
