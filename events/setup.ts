import type { Interaction } from 'discord.js';
import { PermissionFlagsBits, Events, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { optionButtons, successEmbedBuilder, getQuarantine } from '../utils.js';
import prisma from '../database.js';

export default class Setup {
	name = Events.InteractionCreate;

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		if (interaction.customId === 'antispam_yes') {
			await interaction.deferReply();
			await prisma.guild.upsert({
				where: { guild: interaction.guildId! },
				update: { antiSpam: true },
				create: { guild: interaction.guildId!, antiSpam: true },
			});
		} else if (interaction.customId === 'antispam_no') {
			await interaction.deferReply();
			await prisma.guild.update({
				where: { guild: interaction.guildId! },
				data: { antiSpam: false },
			});
		}

		if (interaction.customId === 'antispam_yes' || interaction.customId === 'antispam_no') {
			const embed = new EmbedBuilder({
				title: ':speech_balloon: Anti Toxicity',
				description: '<:reply:1067159718646263910> Would you like to use our anti toxicity system to mantain a PG-13 environment in the server?',
				color: 0x2f3136,
			});

			await interaction.editReply({ embeds: [embed], components: [optionButtons('antitoxicity')] });
		}

		if (interaction.customId === 'antitoxicity_yes') {
			await interaction.deferReply();
			await prisma.guild.upsert({
				where: { guild: interaction.guildId! },
				update: { toxicityFilter: true },
				create: { guild: interaction.guildId!, toxicityFilter: true },
			});
		} else if (interaction.customId === 'antitoxicity_no') {
			await interaction.deferReply();
			await prisma.guild.update({
				where: { guild: interaction.guildId! },
				data: { toxicityFilter: false },
			});
		}

		if (interaction.customId === 'antitoxicity_yes' || interaction.customId === 'antitoxicity_no') {
			const embed = new EmbedBuilder({
				title: ':scroll: Logger',
				description: '<:reply:1067159718646263910> Would you like to use the logger to know how your moderators use this bot?',
				color: 0x2f3136,
			});

			await interaction.editReply({ embeds: [embed], components: [optionButtons('logger')] });
		}

		if (interaction.customId === 'logger_yes') {
			await interaction.deferReply();
			const logsChannel = await interaction.guild?.channels.create({
				name: 'logs',
				permissionOverwrites: [
					{
						id: interaction.guildId!,
						deny: [PermissionFlagsBits.ViewChannel],
					},
				],
			});
			await prisma.guild.upsert({
				where: { guild: interaction.guildId! },
				update: { logs: logsChannel?.id! },
				create: { guild: interaction.guildId!, logs: logsChannel?.id! },
			});
		} else if (interaction.customId === 'logger_no') {
			await interaction.deferReply();
			await prisma.guild.update({
				where: { guild: interaction.guildId! },
				data: { logs: null },
			});
		}

		if (interaction.customId === 'logger_yes' || interaction.customId === 'logger_no') {
			const embed = new EmbedBuilder({
				title: '<:check:1027354811164786739> Verification',
				description:
					'<:reply:1067159718646263910> Would you also like to set up verification in this server? (this will create a members role and verification channel, if you want to customize it use the `/verification` and `/whitelist` commands), please note that setting up verification will remove permissions from everyone role.',
				color: 0x2f3136,
			});

			await interaction.editReply({ embeds: [embed], components: [optionButtons('verification')] });
		}

		if (interaction.customId === 'verification_yes') {
			await interaction.deferReply();

			const channel = await interaction.guild?.channels.create({
				name: 'verify-here'
			})

			const quarantine = await getQuarantine(interaction?.guild!)

			interaction.guild?.channels.cache.forEach(async ch => {
				const c = ch as TextChannel | VoiceChannel;
				await c.permissionOverwrites?.edit(quarantine!, { ViewChannel: false });
			});

			channel.permissionOverwrites?.edit(quarantine!, { ViewChannel: true, SendMessages: false });
			channel.permissionOverwrites?.edit(interaction.guildId!, { ViewChannel: false });

			const verificationButtons = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						label: 'Verify',
						style: ButtonStyle.Success,
						custom_id: 'verify',
					}),
					new ButtonBuilder({
						label: 'Help',
						style: ButtonStyle.Link,
						url: 'https://discord.gg/NxJzWWqhdQ',
					}),
				],
			});

			const verificationEmbed = new EmbedBuilder({
				title: '<:check:1027354811164786739> Verification',
				description: `<:blank:1008721958210383902> <:arrow:1068604670764916876> To access \`${interaction.guild?.name}\` you must complete the verification process. \n<:blank:1008721958210383902><:blank:1008721958210383902><:reply:1067159718646263910> Press on the **Verify** button below.`,
				color: 0x2f3136,
			});

			await channel.send({ embeds: [verificationEmbed], components: [verificationButtons] });
		}

		if (interaction.customId === 'verification_yes' || interaction.customId === 'verification_no') {
			const embed = new EmbedBuilder({
				title: '<:check:1008718056891101194> Anti Raid',
				description: '<:reply:1067159718646263910> Perfect!, would you like to activate the Anti Raid Sytem?',
				color: 0x2f3136,
			});

			await interaction.editReply({ embeds: [embed], components: [optionButtons('antiraid')] });
		}

		if (interaction.customId === 'antiraid_yes') {
			await interaction.deferReply();
			await prisma.guild.upsert({
				where: { guild: interaction.guildId! },
				update: { antiRaid: true },
				create: { guild: interaction.guildId!, antiRaid: true },
			});
		}

		if (interaction.customId === 'antiraid_yes' || interaction.customId === 'antiraid_no') {
			await interaction.editReply({ embeds: [successEmbedBuilder('Setup completed! This channel will be deleted in 5 seconds.')] });

			setTimeout(async () => {
				await interaction.channel?.delete();
			}, 5000);
		}
	}
}
