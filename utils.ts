import type { Client, GuildMember, Guild, ChatInputCommandInteraction, TextChannel, GuildMemberRoleManager } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder, Colors, ActivityType } from 'discord.js';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import prisma from './database.js';
import emojis from './emojis.js'

export const dir = dirname(fileURLToPath(import.meta.url));

interface LogBuilderOptions {
	member: GuildMember | string;
	guild?: Guild;
	content?: string;
	reason: string;
	punished?: boolean;
}

const API_KEY = process.env.GOOGLE_API_KEY;

export const setActivity = (client: Client): void => {
	client.user?.setActivity(`${client.guilds.cache.size} ${client.guilds.cache.size !== 1 ? 'servers' : 'server'} | /setup`, {
		type: ActivityType.Watching,
	});
};

export const timeSince = (timestamp: number) => {
  const now = new Date()
  const secondsPast = (now.getTime() - timestamp) / 1000;
	
  if (secondsPast < 60) {
    return `${parseInt(secondsPast)}s`;
  } else if (secondsPast < 3600) {
    return `${parseInt(secondsPast / 60)}m`;
  } else if (secondsPast <= 86400) {
    return `${parseInt(secondsPast / 3600)}h`;
  } else if (secondsPast > 86400) {
    const day = timestamp.getDate();
    const month = timestamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
    const year = timestamp.getFullYear() == now.getFullYear() ? "" : ` ${timestamp.getFullYear()}`;
    return `${day} ${month}${year}`;
  }
}

export const loadImage = async (image: string): Promise<Buffer> => {
	const res = await fetch(image);
	return Buffer.from(await res.arrayBuffer());
};

export const getQuarantine = async (guild: string) => {
	const oldGuild = await prisma.guild.findUnique({
		where: { guild: guild.id },
		select: { quarantine: true }
	})

	const quarantine = guild.roles.cache.get(oldGuild?.quarantine)
	
	if (!guild.roles.cache.get(quarantine?.id!)) {
		const role = await guild?.roles?.create({
			name: 'Quarantine',
		});

		role?.setPermissions([]);

		await prisma.guild.upsert({
			where: { guild: guild.id },
			update: { quarantine: role?.id! },
			create: {
				guild: guild.id,
				quarantine: role?.id!,
			},
		});

		return role
	}

	return quarantine
}

export const analyzeText = async (text: string) => {
	const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';

	const analyzeRequest = {
		comment: { text },
		requestedAttributes: {
			TOXICITY: {},
		},
	};

	const client: Readonly<{
		comments: {
			analyze: (opts: { key: string | undefined; resource: typeof analyzeRequest }) => Promise<{
				data: { attributeScores: { TOXICITY: { summaryScore: { value: number } } } };
			}>;
		};
	}> = await google.discoverAPI(DISCOVERY_URL);

	const response = await client.comments.analyze({
		key: API_KEY,
		resource: analyzeRequest,
	});

	return response.data.attributeScores.TOXICITY.summaryScore.value * 100;
};

export const buttons = new ActionRowBuilder<ButtonBuilder>({
	components: [
		new ButtonBuilder({
			label: 'Invite Me',
			style: ButtonStyle.Link,
			url: 'https://discord.com/oauth2/authorize?client_id=1008400801628164096&permissions=8&scope=bot%20applications.commands',
		}),
		new ButtonBuilder({
			label: 'Support Server',
			style: ButtonStyle.Link,
			url: 'https://discord.gg/NxJzWWqhdQ',
		}),
		new ButtonBuilder({
			label: 'Website',
			style: ButtonStyle.Link,
			url: 'https://pyritebot.netlify.app/',
		}),
	],
});

export const errorEmbedBuilder = (message: string) =>
	new EmbedBuilder({
		description: `${emojis.error}  ${message}`,
		color: Colors.DarkRed,
	});

export const successEmbedBuilder = (message: string) =>
	new EmbedBuilder({
		description: `${emojis.check}  ${message}`,
		color: Colors.Green,
	});

export const warnEmbedBuilder = (message: string) =>
	new EmbedBuilder({
		description: `${emojis.warn}  ${message}`,
		color: Colors.Yellow,
	});

export const logBuilder = ({ member, guild, content, reason, punished = false }: LogBuilderOptions) => {
	const embed = new EmbedBuilder({
		description: `
<:arrow:1027722692662673429> **Executor:** ${member?.user ?? member}
<:arrow:1027722692662673429> **Reason:** **\`${reason}\`**
<:arrow:1027722692662673429> **Punished:** \`${punished ? 'yes' : 'no'}\`
<:arrow:1027722692662673429> **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
		footer: {
			text: member?.guild?.name ?? guild?.name!,
			icon_url: member?.guild?.iconURL() ?? guild?.iconURL()!,
		},
		timestamp: new Date().toISOString(),
		color: 0x2f3136,
	});
	return {
		embeds: [embed],
	};
};

export const punishButtons = id => new ActionRowBuilder<ButtonBuilder>({
	components: [
		new ButtonBuilder({
			custom_id: `punish_kick-${id}`,
			label: 'Kick',
			style: ButtonStyle.Danger,
		}),
		new ButtonBuilder({
			custom_id: `punish_ban-${id}`,
			label: 'Ban',
			style: ButtonStyle.Danger,
		}),
		new ButtonBuilder({
			custom_id: `punish_quarantine-${id}`,
			label: 'Quarantine',
			style: ButtonStyle.Secondary,
		}),
	]
})

export const addReport = async (interaction: ChatInputCommandInteraction) => {
	const user = interaction.options.getUser('user', true);
	const reason = interaction.options.getString('reason', true);
	const file = interaction.options.getAttachment('image', true);

	if (user?.id === interaction.user.id) {
		await interaction.reply({ embeds: [errorEmbedBuilder("You can't report yourself!")] });
		return;
	}

	const reportSubmittedEmbed = new EmbedBuilder({
		title: '<:check:1027354811164786739> Report Submitted',
		description: `Your report was submitted and our staff team will be looking into it.
Thank you for submitting this report. For more updates please join our support server below. Please also keep your DMS on so we can easly send you feedback.`,
		color: 0x2f3136,
	});

	await interaction.reply({
		embeds: [reportSubmittedEmbed],
		components: [
			new ActionRowBuilder<ButtonBuilder>({
				components: [new ButtonBuilder({ label: 'Support Server', style: ButtonStyle.Link, url: 'https://discord.gg/NxJzWWqhdQ' })],
			}),
		],
		ephemeral: true,
	});
	const channel = interaction.client.channels.cache.get('1022909267440828466') as TextChannel;

	await channel?.send({
		embeds: [
			new EmbedBuilder({
				color: 0x2f3136,
				title: '<:arrow:1009057573590290452> New Report!',
				description: `<:1412reply:1009087336828649533>*New report for ${user}* \n\n **Reason:** ${reason}`,
				image: {
					url: 'attachment://report.png',
				},
			}),
		],
		files: [new AttachmentBuilder(file?.url!, { name: 'report.png' })],
		components: [
			new ActionRowBuilder<ButtonBuilder>({
				components: [new ButtonBuilder({
					custom_id: `report_approve-${reason}-${user?.id}`,
					label: 'Approve',
					style: ButtonStyle.Success,
				})],
			}),
		],
	});
};

export const addWarn = async (interaction: ChatInputCommandInteraction) => {
	const member = interaction.options.getMember('user') as GuildMember;
	const reason = interaction.options.getString('reason', true);

	if (!member) {
		await interaction.reply({ embeds: [errorEmbedBuilder("Couldn't find that member!")], ephemeral: true });
		return;
	}

	if (member.user.bot) {
		await interaction.reply({ embeds: [errorEmbedBuilder('You cannot warn a bot!')], ephemeral: true });
		return;
	}

	if (member.user.id === interaction.user.id) {
		await interaction.reply({ embeds: [errorEmbedBuilder('You cannot warn yourself!')], ephemeral: true });
		return;
	}

	if (member.user.id === member.guild.ownerId) {
		await interaction.reply({ embeds: [errorEmbedBuilder('You cannot warn the owner of the server!')], ephemeral: true });
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId! },
			select: { mods: true, admins: true, owners: true },
		});

		const roles = interaction.member?.roles as GuildMemberRoleManager;

		if (
			!(
				roles.cache.has(guild?.mods!) ||
				guild?.admins.includes(interaction.user.id) ||
				guild?.owners.includes(interaction.user.id) ||
				interaction.user.id === interaction.guild?.ownerId
			)
		) {
			await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to warn members!")] });
			return;
		}

		if (guild?.admins.includes(member.user.id) && interaction.user.id !== member.guild.ownerId) {
			await interaction.editReply({ embeds: [errorEmbedBuilder('You cannot warn an admin!')] });
			return;
		}

		await prisma.user.upsert({
			where: { user: member.user.id },
			update: {
				warns: {
					push: { guild: interaction.guildId!, reason },
				},
			},
			create: {
				user: member.user.id,
				warns: [{ guild: interaction.guildId!, reason }],
			},
		});
	} catch {
		await interaction.editReply(defaultError);
		return;
	}

	await member.send({ embeds: [warnEmbedBuilder(`You have been warned in **${member.guild.name}** for **${reason}**!`)] });

	await interaction.editReply({ embeds: [successEmbedBuilder(`${member.user} was successfully warned for **${reason}**!`)] });

	const guild = await prisma.guild.findUnique({
		where: { guild: interaction.guildId! },
		select: { logs: true },
	});

	const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
	await logs?.send(
		logBuilder({
			member: interaction.member as GuildMember,
			content: `${member.user} has been warned by ${interaction.user}`,
			reason,
		})
	);
};

export const optionButtons = (id: string) =>
	new ActionRowBuilder<ButtonBuilder>({
		components: [
			new ButtonBuilder({
				label: 'Yes',
				style: ButtonStyle.Primary,
				custom_id: `${id}_yes`,
			}),
			new ButtonBuilder({
				label: 'No',
				style: ButtonStyle.Danger,
				custom_id: `${id}_no`,
			}),
		],
	});

export const defaultError = {
	files: [new AttachmentBuilder(join(process.cwd(), './assets/defaultError.png'), { name: 'error.png' })],
	components: [buttons],
	ephemeral: true,
};
