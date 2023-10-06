import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
} from "discord.js";
import { errorEmbedBuilder, emojis } from "../utils.js";
import { prisma } from "../database.js";

export default class {
	data = new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Show your configured settings!")
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

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

		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId },
			select: {
				antiLinks: true,
				antiAlts: true,
				antiRaid: true,
				antiSpam: true,
				spamMinutes: true,
				spamMessageLimit: true,
				toxicityFilter: true,
				verificationChannel: true,
				members: true,
				lockdownChannel: true,
				logs: true,
			},
		});

		const embed = new EmbedBuilder({
			title: "<:settings:1028282277299503104>  Settings",
			description: `${emojis.reply1} Here are all of the configured settings below:`,
			fields: [
				{
					name: `${
						guild?.antiSpam ? emojis.check : emojis.error
					} __Anti Spam__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Spam Minutes:**  \`${guild?.spamMinutes}\`
          ${emojis.blank}${emojis.arrow} **Spam Message Limit:** \`${guild?.spamMessageLimit}\`
          `,
				},
				{
					name: `${
						guild?.verificationChannel ? emojis.check : emojis.error
					} __Verification__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Verification Channel:** <#${guild?.verificationChannel}>
          ${emojis.blank}${emojis.arrow} **Verification Role:** <@&${guild?.members}>
          `,
				},
				{
					name: `${guild?.logs ? emojis.check : emojis.error} __Logs__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Logs Channel:** <#${guild?.logs}>
          `,
				},
				{
					name: `${guild?.toxicityFilter ? emojis.check : emojis.error} __Anti Toxicity__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Toxicity Logs Channel:** <#${guild?.logs}>
          `,
				},
				{
					name: `${guild?.antiLinks ? emojis.check : emojis.error} __Anti Links__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Anti Links Log Channel:** <#${guild?.logs}>
          `,
				},
				{
					name: `${guild?.antiRaid ? emojis.check : emojis.error} __Anti Raid__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Anti Raid Log Channel:** <#${guild?.logs}>
          ${emojis.blank}${emojis.arrow} **Channel Creation Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Channel Deletion Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Role Creation Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Role Deletion Limit:** \`5\`
          ${emojis.blank}${emojis.arrow} **Punishment:** Quarantine
          `,
				},
				{
					name: `${guild?.antiAlts ? emojis.check : emojis.error} __Anti Alts__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Anti Alts Log Channel:** <#${guild?.logs}>
          ${emojis.blank}${emojis.arrow} **Max Days:** \`7\`
          `,
				},
				{
					name: `${guild?.lockdownChannel ? emojis.check : emojis.error} __Lockdown__`,
					value: `
          ${emojis.blank}${emojis.arrow} **Lockdown Channel**: ${
						guild?.lockdownChannel ? `<#${guild?.lockdownChannel}>` : "Not Set"
					}
          `,
				},
			],
			color: 0x2b2d31,
			footer: {
				text: interaction.guild?.name ?? "",
				icon_url: interaction.guild?.iconURL() ?? "",
			},
		});

		await interaction.editReply({ embeds: [embed] });
	}
}
