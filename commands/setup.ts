import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { emojis, errorEmbedBuilder, optionButtons } from "../utils.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("setup")
		.setDescription("Setup the Bot in this server!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		const channel = await interaction.guild?.channels.create({
			name: "setup-channel",
			permissionOverwrites: [
				{
					id: interaction.guildId,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.user.id,
					allow: [PermissionFlagsBits.ViewChannel],
				},
			],
		});

		await interaction.reply({
			content: `Go to ${channel} to continue setting up the server!`,
			ephemeral: true,
		});
		await channel?.send({
			content: `${interaction.user}, I will walk you through the steps to set up ${interaction.client.user} in this server!`,
		});
		const embed = new EmbedBuilder()
			.setTitle(":no_entry_sign: Anti Spam")
			.setDescription(
				`${emojis.reply1} Would you like to use our effective spam system to stop members from spamming in your server?`,
			)
			.setColor(0x2b2d31);
		await channel?.send({
			embeds: [embed],
			components: [optionButtons("antispam")],
		});
	}
}
