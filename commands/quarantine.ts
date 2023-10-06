import {
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
	PermissionFlagsBits,
} from "discord.js";
import {
	successEmbedBuilder,
	getQuarantine,
	errorEmbedBuilder,
} from "../utils.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("quarantine")
		.setNameLocalizations({ "es-ES": "quarentena" })
		.setDescription("Manage the quarantine!")
		.setDescriptionLocalizations({ "es-ES": "¡Maneja la quarentena!" })
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("add")
				.setNameLocalizations({ "es-ES": "añadir" })
				.setDescription("Quarantine a user!")
				.setDescriptionLocalizations({
					"es-ES": "¡Pon en quarentena a un usuario!",
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
				.setName("remove")
				.setNameLocalizations({ "es-ES": "removir" })
				.setDescription("Unquarantine a user!")
				.setDescriptionLocalizations({
					"es-ES": "¡Quita de la quarentena a un usuario!",
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

		const member = interaction.options.getMember("user") as GuildMember;
		// rome-ignore lint/style/noNonNullAssertion: Guild will always be defined, since this command doesn't allow you to run it in anything other than a guild.
		const quarantine = await getQuarantine(interaction.guild!);

		switch (interaction.options.getSubcommand()) {
			case "add":
				if (quarantine) {
					await member.roles.add(quarantine);
				}

				member.roles.cache.forEach(async (r) => {
					await member.roles.remove(r, "Quarantined this user").catch(() => {});
				});

				await interaction.editReply({
					embeds: [successEmbedBuilder(`${member.user} has been quarantined!`)],
				});
				break;

			case "remove":
				if (quarantine) {
					await member.roles.remove(quarantine);
				}

				await interaction.editReply({
					embeds: [
						successEmbedBuilder(`${member.user} has been unquarantined!`),
					],
				});
				break;
		}
	}
}
