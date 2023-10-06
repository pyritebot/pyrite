import type {
	Client,
	GuildMember,
	Guild,
	ChatInputCommandInteraction,
	TextChannel,
	GuildMemberRoleManager,
} from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	AttachmentBuilder,
	EmbedBuilder,
	Colors,
	ActivityType,
} from "discord.js";
import { google } from "googleapis";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "./database.js";

export const dir = dirname(fileURLToPath(import.meta.url));

export const emojis = {
	home: '<:home:1068613634957266964>',
	list: '<:list:1030927155472904283>',
	lock: '<:lock:1027724211944431708>',
	warn: '<:warn:1027361416119853187>',
	settings: '<:settings:1028282277299503104>',
	error: '<:error:1027359606126690344>',
	check: '<:check:1027354811164786739>',
	arrow: '<:arrow:1068604670764916876>',
	reply1: '<:reply:1067159718646263910>',
	reply2: '<:replycontinued2:1067140301187186738>',
	reply3: '<:replycontinued:1067140193146114048>',
	blank: '<:blank:1008721958210383902>',
	moderator: '<:security:1071812054010298528>',
	pyrite: '<:pyrite:1074700667307950180>',
	pyritebeta: '<:pyritebeta:1074701015644901417>',
	arrow2: '<:arrow2:1096900871545159801>',
	compass: '<:compass:1097894967545958520>',
};

interface LogBuilderOptions {
	member: GuildMember | string;
	guild?: Guild;
	reason: string;
	punished?: boolean;
}

const API_KEY = process.env.GOOGLE_API_KEY;

export const setActivity = (client: Client): void => {
	client.user?.setActivity(
		`${client.guilds.cache.size} ${
			client.guilds.cache.size !== 1 ? "servers" : "server"
		} | /setup`,
		{
			type: ActivityType.Watching,
		},
	);
};

export const timeSince = (date: Date) => {
	const now = new Date();
	const secondsPast = (now.getTime() - date.getTime()) / 1000;

	if (secondsPast < 60) {
		return `${secondsPast}s`;
	} else if (secondsPast < 3600) {
		return `${secondsPast / 60}m`;
	} else if (secondsPast <= 86400) {
		return `${secondsPast / 3600}h`;
	} else {
		const day = date.getDate();
		const month = date.toDateString().match(/ [a-zA-Z]*/)?.[0].replace(" ", "");
		const year =
			date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;
		return `${day} ${month}${year}`;
	}
};

export const loadImage = async (image: string): Promise<Buffer> => {
	const res = await fetch(image);
	return Buffer.from(await res.arrayBuffer());
};

export const getQuarantine = async (guild: Guild) => {
	const oldGuild = await prisma.guild.findUnique({
		where: { guild: guild.id },
		select: { quarantine: true },
	});

	const quarantine = guild.roles.cache.get(oldGuild?.quarantine ?? "");

	if (!quarantine) {
		const role = await guild.roles.create({
			name: "Quarantine",
		});

		role?.setPermissions([]);

		await prisma.guild.upsert({
			where: { guild: guild?.id },
			update: { quarantine: role?.id },
			create: {
				guild: guild.id,
				quarantine: role.id,
			},
		});

		return role;
	}

	return quarantine;
};

export const analyzeText = async (text: string) => {
	const DISCOVERY_URL =
		"https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1";

	const analyzeRequest = {
		comment: { text },
		requestedAttributes: {
			TOXICITY: {},
		},
	};

	const client: Readonly<{
		comments: {
			analyze: (opts: {
				key: string | undefined;
				resource: typeof analyzeRequest;
			}) => Promise<{
				data: {
					attributeScores: { TOXICITY: { summaryScore: { value: number } } };
				};
			}>;
		};
	}> = await google.discoverAPI(DISCOVERY_URL);

	const response = await client.comments.analyze({
		key: API_KEY,
		resource: analyzeRequest,
	});

	return response.data.attributeScores.TOXICITY.summaryScore.value * 100;
};

export const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
	new ButtonBuilder()
		.setLabel("Invite Me")
		.setStyle(ButtonStyle.Link)
		.setURL("https://discord.com/oauth2/authorize?client_id=1008400801628164096&permissions=8&scope=bot%20applications.commands"),
	new ButtonBuilder()
		.setLabel("Support Server")
		.setStyle(ButtonStyle.Link)
		.setURL("https://discord.gg/NxJzWWqhdQ"),
	new ButtonBuilder()
		.setLabel("Website")
		.setStyle(ButtonStyle.Link)
		.setURL("https://pyritebot.netlify.app/"),
);

export const errorEmbedBuilder = (message: string) =>
	new EmbedBuilder()
		.setDescription(`${emojis.error}  ${message}`)
		.setColor(Colors.DarkRed);

export const successEmbedBuilder = (message: string) =>
	new EmbedBuilder()
		.setDescription(`${emojis.check}  ${message}`)
		.setColor(Colors.Green);

export const warnEmbedBuilder = (message: string) =>
	new EmbedBuilder()
		.setDescription(`${emojis.warn}  ${message}`)
		.setColor(Colors.Yellow);

export const logBuilder = ({
	member,
	guild,
	reason,
	punished = false,
}: LogBuilderOptions) => {
	const embed = new EmbedBuilder()
		.setTitle(`${emojis.warn} New Alert`)
		.setDescription(`
${emojis.reply1} A new Moderator action was just logged below:

${emojis.arrow} **Executor:** ${(member as GuildMember)?.user ?? `<@${member}>`}
${emojis.arrow} **Reason:** ${reason}
${emojis.arrow} **Punished:** \`${punished ? "Yes" : "No"}\`
${emojis.arrow} **Time:** <t:${Math.floor(Date.now() / 1000)}:R>
`)
		.setTimestamp(new Date())
		.setColor(0x2b2d31)
		.setThumbnail((member as GuildMember | null)?.user.displayAvatarURL() ?? "")
		.setFooter({
			text: (member as GuildMember)?.guild?.name ?? guild?.name,
			iconURL: (member as GuildMember)?.guild?.iconURL() ??
				guild?.iconURL() ??
				undefined,
		});
	
	return {
		embeds: [embed],
	};
};

export const punishButtons = (id: string) =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`punish_kick-${id}`)
			.setLabel("Kick")
			.setStyle(ButtonStyle.Danger),
		new ButtonBuilder()
			.setCustomId(`punish_ban-${id}`)
			.setLabel("Ban")
			.setStyle(ButtonStyle.Danger),
		new ButtonBuilder()
			.setCustomId(`punish_quarantine-${id}`)
			.setLabel("Quarantine")
			.setStyle(ButtonStyle.Secondary),
	);

export const addWarn = async (interaction: ChatInputCommandInteraction) => {
	const member = interaction.options.getMember("member") as GuildMember;
	const reason = interaction.options.getString("reason", true);

	if (!member) {
		await interaction.reply({
			embeds: [errorEmbedBuilder("Couldn't find that member!")],
			ephemeral: true,
		});
		return;
	}

	if (member.user.bot) {
		await interaction.reply({
			embeds: [errorEmbedBuilder("You cannot warn a bot!")],
			ephemeral: true,
		});
		return;
	}

	if (member.user.id === interaction.user.id) {
		await interaction.reply({
			embeds: [errorEmbedBuilder("You cannot warn yourself!")],
			ephemeral: true,
		});
		return;
	}

	if (member.user.id === member.guild.ownerId) {
		await interaction.reply({
			embeds: [errorEmbedBuilder("You cannot warn the owner of the server!")],
			ephemeral: true,
		});
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		const guild = await prisma.guild.findUnique({
			where: { guild: interaction.guildId ?? "" },
			select: { mods: true, admins: true, owners: true },
		});

		const roles = interaction.member?.roles as GuildMemberRoleManager;

		if (
			!(
				roles.cache.has(guild?.mods ?? "") ||
				guild?.admins.includes(interaction.user.id) ||
				guild?.owners.includes(interaction.user.id) ||
				interaction.user.id === interaction.guild?.ownerId
			)
		) {
			await interaction.editReply({
				embeds: [
					errorEmbedBuilder("You don't have permission to warn members!"),
				],
			});
			return;
		}

		if (
			guild?.admins.includes(member.user.id) &&
			interaction.user.id !== member.guild.ownerId
		) {
			await interaction.editReply({
				embeds: [errorEmbedBuilder("You cannot warn an admin!")],
			});
			return;
		}

		await prisma.warn.create({
			data: {
				userId: member.user.id,
				guildId: interaction.guildId ?? "",
				reason,
			},
		});
	} catch (err) {
		console.error(err);
		await interaction.editReply(defaultError);
		return;
	}

	await member
		.send({
			embeds: [
				warnEmbedBuilder(
					`You have been warned in **${member.guild.name}** for **${reason}**!`,
				),
			],
		})
		.catch(() => {});

	await interaction.editReply({
		embeds: [
			successEmbedBuilder(
				`${member.user} was successfully warned for **${reason}**!`,
			),
		],
	});

	const guild = await prisma.guild.findUnique({
		where: { guild: interaction.guildId ?? "" },
		select: { logs: true },
	});

	const logs = interaction.guild?.channels.cache.get(
		guild?.logs ?? "",
	) as TextChannel;

	await logs?.send(
		logBuilder({
			member: interaction.member as GuildMember,
			reason: `${member.user.tag} has been warned by ${interaction.user.tag}: ${reason}`,
		}),
	);
};

export const optionButtons = (id: string) =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Yes")
			.setStyle(ButtonStyle.Primary)
			.setCustomId(`${id}_yes`),
		new ButtonBuilder()
			.setLabel("No")
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`${id}_no`),
	);

export const defaultError = {
	files: [
		new AttachmentBuilder(join(process.cwd(), "./assets/error.gif"))
			.setName("error.gif")
			.setDescription("It seems you stumbled upon an unknown error!, if the problem persists, do not doubt to contact us our support server."),
	],
	components: [buttons],
	ephemeral: true,
};
