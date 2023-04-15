import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, VoiceChannel, AttachmentBuilder } from 'discord.js';
import { Client, GatewayIntentBits, REST, Collection, Routes, EmbedBuilder, Colors, PermissionFlagsBits } from 'discord.js';
import { loxt } from 'loxt';
import { setActivity, analyzeText, dir, buttons, successEmbedBuilder, defaultError, logBuilder } from './utils.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import emojis from '../emojis.js';
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

client.on('guildCreate', async guild => {
	setActivity(client)
	const embed = new EmbedBuilder({
		title: '<:list:1030927155472904283> Welcome to Pyrite Bot',
		description:
`<:reply:1067159718646263910> Thank you for choosing **Pyrite Bot**, I will make sure to try my best to protect your server from raider's, spammer's and so much more.
   
You can configure me on the dashboard below this message. Need more servers protected? Add me to any server you think needs protection!

`,
		color: 0x2b2d31,
    image: {
      url: 'attachment://pyritebot.png',
    }
	});
	const owner = await guild.fetchOwner();
	await owner.send({ embeds: [embed], files: [new AttachmentBuilder(join(process.cwd(), './assets/pyritebot.png'))], components: [buttons] }).catch(() => {});
});

client.on('guildDelete', () => setActivity(client));

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = commands.get(interaction.commandName);
	await command?.run(interaction);
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
			description: `<:reply:1067159718646263910>This server is currently on lockdown. Meaning no one can chat in this server. Please wait until the owners unlock the server.`,
			color: 0x2b2d31,
			footer: {
				icon_url: interaction.guild.iconURL(),
				text: interaction.guild.name,
			},
			timestamp: new Date().toISOString()
		});

		const message = await channel?.send({ embeds: [lockdownEmbed] });

		await prisma.guild.upsert({
			where: { guild: interaction.guildId! },
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
