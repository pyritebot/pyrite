import {
	EmbedBuilder,
	Events,
	type Interaction,
	type TextChannel,
	type VoiceChannel,
} from "discord.js";
import { prisma } from "../database.js";
import {
	defaultError,
	emojis,
	errorEmbedBuilder,
	successEmbedBuilder,
} from "../utils.js";

export default class {
	name = Events.InteractionCreate;

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		if (interaction.customId !== "lockdown_continue") return;

		if (!interaction.inGuild()) {
			await interaction.reply({
				embeds: [
					errorEmbedBuilder("This command can only be run on a server!"),
				],
			});
			return;
		}

		try {
			await interaction.deferReply({ ephemeral: true });

			const channel = (await interaction.guild?.channels.create({
				name: "server-lockdown",
			})) as TextChannel | VoiceChannel;

			interaction.guild?.channels.cache.forEach((ch) => {
				const c = ch as TextChannel | VoiceChannel;
				interaction.guild?.roles.cache
					.filter((role) => role.id !== "@everyone")
					.forEach((role) =>
						c.permissionOverwrites.edit(role.id, { SendMessages: false }),
					);
			});

			const lockdownEmbed = new EmbedBuilder()
				.setTitle(`${emojis.lock} Lockdown`)
				.setDescription(
					`${emojis.reply1} This server is currently on lockdown. Meaning no one can chat in this server. Please wait until the owners unlock the server.`,
				)
				.setColor(0x2b2d31)
				.setTimestamp(new Date())
				.setFooter({
					iconURL: interaction.guild?.iconURL() ?? "",
					text: interaction.guild?.name ?? "",
				});

			const message = await channel?.send({ embeds: [lockdownEmbed] });

			await prisma.guild.upsert({
				where: { guild: interaction.guildId },
				update: {
					raidMode: true,
					lockdownChannel: channel?.id,
					lockdownMessage: message?.id,
				},
				create: {
					guild: interaction.guildId,
					raidMode: true,
					lockdownChannel: channel?.id,
					lockdownMessage: message?.id,
				},
			});

			await interaction.editReply({
				embeds: [successEmbedBuilder("lockdown was successfully activated")],
			});
		} catch {
			await interaction.editReply(defaultError);
		}
	}
}
