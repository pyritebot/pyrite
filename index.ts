import {
	ChatInputCommandInteraction,
	Client,
	Collection,
	GatewayIntentBits,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import Fastify from "fastify";
import { z } from "zod";
import { dir, setActivity } from "./utils.js";

const envVariables = z.object({
	DISCORD_TOKEN: z.string(),
	DATABASE_URL: z.string(),
	GOOGLE_API_KEY: z.string(),
});

envVariables.parse(process.env);

declare global {
	namespace NodeJS {
		// biome-ignore lint/suspicious/noEmptyInterface: Infering from zod's types.
		interface ProcessEnv extends z.infer<typeof envVariables> {}
	}
}

const TOKEN = process.env.DISCORD_TOKEN;

interface ClientCommand {
	data: SlashCommandBuilder;
	run(interaction: ChatInputCommandInteraction): Promise<void>;
}

interface ClientEvent {
	name: string;
	run(x: unknown): Promise<void>;
}

const rest = new REST().setToken(TOKEN);

const commands = new Collection<string, ClientCommand>();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
	],
});

client.once("ready", async () => {
	setActivity(client);
	console.log(`\x1b[32m \x1b[0m Logged in as ${client.user?.tag}`);
	console.log(
		`\x1b[32m \x1b[0m Client in ${client.guilds.cache.size} servers`,
	);
});

client.on("guildDelete", () => setActivity(client));

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = commands.get(interaction.commandName);
	await command?.run(interaction);
});

const loadCommands = async () => {
	const files = await readdir(join(dir, "./commands"));
	files
		.filter((file) => file.endsWith(".js"))
		.forEach(async (file) => {
			const { default: Command }: { default: new () => ClientCommand } =
				await import(join(dir, `./commands/${file}`));
			const command = new Command();
			commands.set(command.data.name, command);
		});
};

const registerEvents = async () => {
	const files = await readdir(join(dir, "./events"));
	files
		.filter((file) => file.endsWith(".js"))
		.forEach(async (file) => {
			const { default: Event }: { default: new () => ClientEvent } =
				await import(join(dir, `./events/${file}`));
			const event = new Event();
			client.on(event.name, event.run.bind(event));
		});
};

const server = Fastify();

server.get("/", async () => "Bot hosting running correctly!");

try {
	await loadCommands();
	await registerEvents();
	await client.login(TOKEN);
	await server.listen({ port: 3000, host: "0.0.0.0" });
	await rest.put(Routes.applicationCommands(client.user?.id ?? ""), {
		body: commands.map(({ data }) => data.toJSON()),
	});
} catch (err) {
	console.error(err);
}
