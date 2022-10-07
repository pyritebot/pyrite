import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, VoiceChannel } from 'discord.js';
import { Client, GatewayIntentBits, REST, Collection, Routes, EmbedBuilder, Colors, PermissionFlagsBits } from 'discord.js';
import { loxt } from 'loxt';
import { setActivity, analyzeText, dir, buttons, successEmbedBuilder, defaultError } from './utils.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import prisma from './database.js';
import Fastify from 'fastify';

const TOKEN = process.env.TOKEN;

interface ICommand {
	data: SlashCommandBuilder;
	run(interaction: ChatInputCommandInteraction): Promise<void>;
}

interface IEvent {
	name: string;
	run(x: unknown): Promise<void>;
}

const rest = new REST().setToken(TOKEN!);
const commands = new Collection<string, ICommand>();
const usersCollection = new Collection<string, number>();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
	],
});

client.once('ready', async () => {
	setActivity(client);
	loxt.ready(`on ${client.user?.tag}`);
	loxt.info(`in ${client.guilds.cache.size} servers`);
});

client.on('messageCreate', async message => {
	if (!message.inGuild()) return;
	if (message.author.id === client.user?.id) return;
	if (message.author.bot) return;

	try {
		const guild = await prisma.guild.findUnique({
			where: {
				guild: message.guildId,
			},
			select: {
				logs: true,
				toxicityFilter: true,
			},
		});

		const logs = message.guild.channels.cache.get(guild?.logs!) as TextChannel | null;

		const level = await analyzeText(message.content);
		const danger = Math.ceil(level);

		const user = await prisma.user.findUnique({
			where: { user: message.author.id },
			select: { toxicity: true },
		});

		if (danger < 20) {
			await prisma.user.upsert({
				where: { user: message.author.id },
				update: { toxicity: { decrement: 0.2 } },
				create: { user: message.author.id },
			});
			if ((user?.toxicity ?? 0) - 0.2 <= 0) {
				await prisma.user.upsert({
					where: { user: message.author.id },
					update: { toxicity: 0 },
					create: { user: message.author.id },
				});
			}
		} else if (danger > 80) {
			if (!guild?.toxicityFilter) return;
			await prisma.user.upsert({
				where: { user: message.author.id },
				update: { toxicity: { increment: 2.5 } },
				create: { user: message.author.id, toxicity: 2.5 },
			});
			if ((user?.toxicity ?? 0) + 2.5 >= 100) {
				await prisma.user.upsert({
					where: { user: message.author.id },
					update: { toxicity: 2.5 },
					create: { user: message.author.id, toxicity: 2.5 },
				});
			}
		}

		if (!guild?.toxicityFilter) return;
		if (danger < 90) return;

		await message.delete();
		const embed = new EmbedBuilder({
			author: {
				name: message.author.tag,
				icon_url: message.author.displayAvatarURL(),
			},
			title: 'Toxic message detected!',
			description: `The message ||${message.content}|| has been reported in ${message.channel} for toxicity`,
			color: Colors.Blurple,
		});
		await logs?.send({ embeds: [embed] });
	} catch {
		return;
	}
});

client.on('messageCreate', async message => {
	if (!message.inGuild()) return;

	const guild = await prisma.guild.findUnique({
		where: {
			guild: message.guildId,
		},
		select: {
			antiSpam: true,
			admins: true,
			owners: true,
			spamMinutes: true,
			spamMessageLimit: true,
		},
	});

	if (!guild?.antiSpam) return;
	if (guild?.admins.includes(message.author.id) || guild?.owners.includes(message.author.id) || message.author.id === message.guild.ownerId) return;

	const limit = guild?.spamMessageLimit;

	try {
		const msgCount = (usersCollection.get(message.author.id) ?? 0) + 1;
		if (message.author.id === client.user?.id) return;
		if (!usersCollection.has(message.author.id)) {
			usersCollection.set(message.author.id, 1);
			setTimeout(() => {
				usersCollection.delete(message.author.id);
			}, 5000);
			return;
		}
		if (msgCount === limit) {
			await message.member?.timeout(60000 * guild?.spamMinutes, 'spamming');
			const messages = [...message.channel.messages.cache.filter(m => m.author.id === message.author.id).values()].slice(0, limit);
			await message.channel.bulkDelete(messages);
		}
		usersCollection.set(message.author.id, msgCount);
	} catch {
		message.guild.roles.cache
			.filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
			.forEach(
				async r =>
					await message.member?.roles
						.remove(r, 'Creating too many channels')
						.catch(async () => await r.setPermissions([], 'Creating too many channels').catch(() => {}))
			);
		setTimeout(async () => {
			await message.member?.timeout(60000 * guild?.spamMinutes, 'spamming');
			const messages = [...message.channel.messages.cache.filter(m => m.author.id === message.author.id).values()].slice(0, limit);
			await message.channel.bulkDelete(messages);
		}, 2000);
	}
});

client.on('guildCreate', async guild => {
	const embed = new EmbedBuilder({
		title: '<:pyrite:1014918476982394891> Thanks for using Pyrite',
		description:
			'Thanks for using me! I will make sure to prevent your server from getting raided etc. \nTo set me up please type `/setup`. If you need help join our [official support server](https://discord.gg/C8bpMPwJen) \nIf you want to view the full commands I have please type `/help`\nI have more features including **Moderation**, **Whitelisting** and much more.',
		color: Colors.Blurple,
	});
	const owner = await guild.fetchOwner();
	owner.send({ embeds: [embed], components: [buttons] }).catch(() => {});
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = commands.get(interaction.commandName);
	await command?.run(interaction);
});

client.on('guildMemberAdd', async member => {
	const guild = await prisma.guild.findUnique({
		where: { guild: member.guild.id },
		select: { raidMode: true },
	});

	if (!guild?.raidMode) return;

	const raidModeEmbed = new EmbedBuilder({
		author: {
			name: member.guild.name,
			icon_url: member.guild.iconURL()!,
		},
		description: `<:1412reply:1009087336828649533> **Join Gate** is currently active in this server. Meaning no one can join at the moment.`,
		color: Colors.Blurple,
	});

	await member.send({ embeds: [raidModeEmbed] });
	await member.kick('Join Gate System');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
	if (interaction.customId !== 'lockdown_continue') return;

	try {
		await interaction.deferReply({ ephemeral: true });

		const channel = (await interaction.guild?.channels.create({
			name: 'server-lockdown',
		})) as TextChannel | VoiceChannel;

		interaction.guild?.channels.cache.forEach(ch => {
			const c = ch as TextChannel | VoiceChannel;
			interaction.guild?.roles.cache
				.filter(role => role.id !== '@everyone')
				.forEach(role => c.permissionOverwrites.edit(role.id, { SendMessages: false }));
		});

		const lockdownEmbed = new EmbedBuilder({
			title: `<:lock:1027724211944431708> Lockdown`,
			description: `This server is currently on lockdown. Meaning no one can chat in this server. Please wait until the owners unlock the server.`,
			color: Colors.Grey,
			footer: {
				icon_url: interaction.guild.iconURL(),
				text: interaction.guild.name,
			},
			timestamp: new Date().toISOString()
		});

		const message = await channel?.send({ embeds: [lockdownEmbed] });

		await prisma.guild.upsert({
			where: {
				guild: interaction.guildId!,
			},
			update: {
				raidMode: true,
				lockdownChannel: channel?.id,
				lockdownMessage: message?.id,
			},
			create: {
				guild: interaction.guildId!,
				raidMode: true,
				lockdownChannel: channel?.id,
				lockdownMessage: message?.id,
			},
		});

		await interaction.editReply({ embeds: [successEmbedBuilder(`lockdown was successfully activated`)] });
	} catch {
		await interaction.editReply(defaultError);
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
	if (interaction.customId !== 'lockdown_cancel') return;

	await interaction.reply({ embeds: [successEmbedBuilder(`lockdown has been cancelled`)], ephemeral: true });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isSelectMenu()) return;
	if (interaction.customId !== 'help_select') return;

	const helpEmbed = new EmbedBuilder({ color: Colors.Blurple });

	switch (interaction.values[0]) {
		case 'start':
			helpEmbed
				.setTitle('<:pyrite:1014918476982394891> Pyrite Bot')
				.setDescription(
					'<:1412reply:1009087336828649533> Welcome to **Pyrite Bot** heres a list of my features below. If you need help using any scroll down in the select menu for them.'
				)
				.setFields(
					{ name: '<:moderator:1008717826552504321> Moderation', value: '<:1412reply:1009087336828649533> Advanced moderation system.' },
					{ name: '<:check:1008718056891101194> Verification', value: '<:1412reply:1009087336828649533> Advanced verification system.' },
					{ name: '<:ban:1020333545887113246> Anti Raid', value: '<:1412reply:1009087336828649533> Advanced Anti Raid system.' },
					{ name: '<:staff:1008719693827285002> Whitelisting', value: '<:1412reply:1009087336828649533> Advanced whitelist system.' },
					{ name: '<:muted:1010127791070658570> AutoMod', value: '<:1412reply:1009087336828649533> Advanced AutoMod system.' }
				);
			break;

		case 'moderation':
			helpEmbed.setTitle('<:moderator:1008717826552504321> Moderation').setDescription("> Here's a list of the moderation commands").setFields(
				{
					name: '`/warns add <user> <reason>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Warn a server member that was spamming or not following the rules. \n',
				},
				{
					name: '`/warns show <user>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Show the amount of warnings a user has.',
				},
				{
					name: '`/warns remove <user> <id>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Remove a users warn by using there warn id.',
				},
				{
					name: '`/warn <user> <reason>`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> Warn a server member that was spamming or not following the rules. (alias to `/warns add <user> <reason>`)',
				},
				{
					name: '`/mute <user> <reason>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Mute a certain user thats breaking your server rules. \n',
				},
				{
					name: '`/clear <amount>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Clear a certain amount of messages in a channel. \n',
				},
				{
					name: '`/kick <user> <reason>`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> Kick a certain user that got muted to many times or is just trying to raid your server.',
				},
				{
					name: '`/ban <user> <reason>`',
					value: "<:blank:1008721958210383902> <:arrow:1009057573590290452> Ban a user thats either a raider or didn't follow your server rules.",
				},
        {
					name: '`/modnick <user>`',
					value: "<:blank:1008721958210383902> <:arrow:1009057573590290452> Change a users name to a pingable one.",
				},
				{ name: '`/logs on <channel>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Set the mod log channel.' },
				{ name: '`/logs off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off mod logs.' }
			);
			break;

		case 'verification':
			helpEmbed
				.setTitle('<:check:1027354811164786739> Verification')
				.setDescription("> Here's a list of the verification commands")
				.setFields(
					{ name: '`/verification on <channel>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on verification.' },
					{ name: '`/verification off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off verification.' }
				)
				.setColor(Colors.Green);
			break;

		case 'whitelisting':
			helpEmbed.setTitle('<:staff:1008719693827285002> Whitelisting').setDescription("> Here's a list of the whitelist commands").setFields(
				{ name: '`/whitelist member <role>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Set the member role whitelist \n' },
				{ name: '`/whitelist mod <role>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Set the mod role whitelist. \n' },
				{ name: '`/whitelist admin <role>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Set the admin role whitelist. \n' },
				{ name: '`/whitelist show`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Show all whitelisted roles \n' },
				{
					name: '`/whitelist owner <user>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Add a user to the owner whitelist \n',
				},
				{ name: '`/whitelist remove <setting>`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Remove a whitelisted role \n' }
			);
			break;

		case 'antiraid':
			helpEmbed.setTitle('<:ban:1020333545887113246> Anti Raid').setDescription("> Here's a list of the anti raid commands").setFields(
				{
					name: '`/joingate on`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on raid mode. **Pyrite** will start to kick every new member that joins so only use this if theres a big raid. \n',
				},
				{ name: '`/joingate off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Use this to turn off raid mode. \n' },
				{
					name: '`/antiraid on`',
					value: "<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on **Pyrite**'s anti raid system to keep your server safe.",
				},
				{ name: '`/antiraid off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off the anti raid system.' },
				{
					name: '`/lockdown on`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> __Only use this if theres a big raid.__ **Pyrite** will fully lockdown the entire server and make sure theres not a raid. \n',
				},
				{ name: '`/lockdown off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> __Use this to stop the lockdown__ \n' },
				{
					name: '`/lockdown update <message>`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Post updates during your server lockdown for members to see.',
				}
			);
			break;

		case 'automod':
			helpEmbed.setTitle('<:muted:1010127791070658570> Automod').setDescription("> Here's a list of the automod commands").setFields(
				{ name: '`/antispam on`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on anti spam so no one can spam.' },
				{ name: '`/antispam off`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on off anti spam.' },
				{
					name: '`/antispam messagelimit <limit>`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> Set a limit for the amount of messages a user can send in a couple seconds before they get muted. \n',
				},
				{
					name: '`/antispam minutes <minutes>`',
					value:
						'<:blank:1008721958210383902> <:arrow:1009057573590290452> Set a number of how many minutes a spammer will be muted for when they spam. \n',
				},
				{ name: '`/antitoxicity on`', value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on anti toxicity in your server. \n' },
				{
					name: '`/antitoxicity off`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off anti toxicity in your server. \n',
				},
				{
					name: '`/antilinks on`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on anti server links in your server. \n',
				},
				{
					name: '`/antilinks off`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off anti server links in your server. \n',
				},
				{
					name: '`/antialts on`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on the anti alts system to keep alt accounts out of your server. \n',
				},
				{ name: '`/antialts off`', 
          value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn off the anti alts system. \n' 
        },
        {
					name: '`/antinsfw on`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on the anti NSFW system. \n',
				},
        {
					name: '`/antinsfw on`',
					value: '<:blank:1008721958210383902> <:arrow:1009057573590290452> Turn on the anti NSFW system. \n',
				},
			);
			break;
	}
	await interaction.update({ embeds: [helpEmbed] });
});

client.on('guildCreate', () => setActivity(client));
client.on('guildDelete', () => setActivity(client));

const registerCommands = async () => {
	const files = await readdir(join(dir, './commands'));
	files
		.filter(file => file.endsWith('.js'))
		.forEach(async file => {
			const { default: Command }: { default: new () => ICommand } = await import(join(dir, `./commands/${file}`));
			const command = new Command();
			commands.set(command.data.name, command);
		});
};

const registerEvents = async () => {
	const files = await readdir(join(dir, './events'));
	files
		.filter(file => file.endsWith('.js'))
		.forEach(async file => {
			const { default: Event }: { default: new () => IEvent } = await import(join(dir, `./events/${file}`));
			const event = new Event();
			client.on(event.name, event.run.bind(event));
		});
};

const server = Fastify();

server.get('/', async () => 'Bot hosting running correctly!');

try {
	await registerCommands();
	await registerEvents();
	await client.login(TOKEN);
	await server.listen({ port: 3000, host: '0.0.0.0' });
	await rest.put(Routes.applicationCommands(client.user?.id!), { body: commands.map(({ data }) => data.toJSON()) });
} catch (err) {
	loxt.error(err);
}
