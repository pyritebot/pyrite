import type {
	GuildMemberRoleManager,
	Interaction,
	Message,
	GuildMember,
	TextChannel,
} from "discord.js";
import {
	Events,
	AttachmentBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { CaptchaGenerator } from "captcha-canvas";
import { successEmbedBuilder, errorEmbedBuilder, buttons, emojis } from "../utils.js";
import { prisma } from "../database.js";

export default class {
	name = Events.InteractionCreate;

	async verify(
		text: string,
		interaction: Interaction,
		msg: Message,
		guild: { quarantine: string | null; members: string | null } | null,
	) {
		try {
			const messages = await msg.channel.awaitMessages({
				max: 1,
				time: 10_000,
				errors: ["time"],
			});

			const roles = interaction.member?.roles as GuildMemberRoleManager | null;

			if (messages.first()?.content === text) {
				await msg.channel.send({
					embeds: [
						successEmbedBuilder(
							"You have been verified successfully, you can now continue to the server!",
						),
					],
				});
				const quarantine = interaction.guild?.roles.cache.get(
					guild?.quarantine ?? "",
				);
				if (quarantine) {
					await roles?.remove(quarantine);
				}
				const members = interaction.guild?.roles.cache.get(
					guild?.members ?? "",
				);
				if (members) {
					await roles?.add(members);
				}
				return;
			}

			const { message: incorrectEmbed, text: incorrectText } =
				await this.embedBuilder();

			await msg.edit(incorrectEmbed);
			await this.verify(incorrectText ?? "", interaction, msg, guild);
		} catch {
			const { message: timeOutEmbed, text: timeOutText } =
				await this.embedBuilder();

			await msg.edit(timeOutEmbed);
			await this.verify(timeOutText ?? "", interaction, msg, guild);
		}
	}

	async embedBuilder() {
		const captcha = new CaptchaGenerator({ width: 450, height: 150 });
		captcha.setDecoy({ total: 30 });
		const buffer = await captcha.generate();

		const file = new AttachmentBuilder(buffer, { name: "verification.png" });
		const verificationEmbed = new EmbedBuilder()
			.setTitle(`${emojis.check} Verification`)
			.setDescription("Are you a human? Lets find out. Simply type the following captcha below so I can verify that you are human. The captcha will only last 10 seconds so be quick!")
			.setImage("attachment://verification.png")
			.setColor(0x2b2d31)

		return {
			message: {
				embeds: [verificationEmbed],
				components: [buttons],
				files: [file],
			},
			text: captcha.text,
		};
	}

	async run(interaction: Interaction) {
		if (!interaction.inGuild()) return;

		if (!interaction.isButton()) return;
		if (interaction.customId !== "verify") return;

		await interaction.deferReply({ ephemeral: true });

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: { quarantine: true, members: true, logs: true },
		});

		const user = await prisma.user.findUnique({
			where: { user: interaction.user.id },
			select: { toxicity: true },
		});

		if ((user?.toxicity ?? 0) >= 90) {
			await interaction.editReply({
				embeds: [
					errorEmbedBuilder(
						"You have been detected as a dangerous user. Please wait until an admin verifies you.",
					),
				],
			});

			const embed = new EmbedBuilder({
				title: `${emojis.warn} Toxic User Detected!`,
				description: `${interaction.user} has a estimate toxicity of **${
					user?.toxicity ?? 90
				}%**.
${emojis.blank}${emojis.arrow} What would you like to proceed with? 
${emojis.blank}${emojis.arrow} **Verification was attempted:** <t:${Math.floor(
					Date.now() / 1000,
				)}:R>`,
				color: 0x2b2d31,
				thumbnail: {
					url: interaction.user.displayAvatarURL(),
				},
			});

			const options = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						custom_id: `verify_toxic-${interaction.user.id}`,
						label: "Verify",
						style: ButtonStyle.Success,
					}),
					new ButtonBuilder({
						custom_id: `kick_toxic-${interaction.user.id}`,
						label: "Kick",
						style: ButtonStyle.Danger,
					}),
					new ButtonBuilder({
						custom_id: `ban_toxic-${interaction.user.id}`,
						label: "Ban",
						style: ButtonStyle.Danger,
					}),
				],
			});

			const logs = interaction.guild?.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel | null;
			await logs?.send({ embeds: [embed], components: [options] });

			return;
		}

		if (
			!(interaction.member?.roles as GuildMemberRoleManager).cache.has(
				guild?.quarantine ?? "",
			)
		) {
			await interaction.editReply({
				embeds: [
					errorEmbedBuilder(
						"It seems that you have already verified. If this is an error, ask an admin to verify you!",
					),
				],
			});
			return;
		}

		await interaction.editReply({
			embeds: [successEmbedBuilder("Follow instructions on DMs")],
		});

		const { message: initialEmbed, text: initialText } =
			await this.embedBuilder();

		const msg = await (interaction.member as GuildMember | null)
			?.send(initialEmbed)
			.catch(async () => {
				await interaction.editReply("You must activate DMs to verify.");
				return;
			});

		if (!msg) return;

		this.verify(initialText ?? "", interaction, msg, guild);
	}
}
