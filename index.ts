import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Client,
  Collection,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
  VoiceChannel,
} from "discord.js";

import {
  buttons,
  defaultError,
  dir,
  errorEmbedBuilder,
  setActivity,
  successEmbedBuilder,
  emojis
} from "./utils.js";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "./database.js";
import Fastify from "fastify";
import { z } from "zod";

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

interface ICommand {
  data: SlashCommandBuilder;
  run(interaction: ChatInputCommandInteraction): Promise<void>;
}

interface IEvent {
  name: string;
  run(x: unknown): Promise<void>;
}

const rest = new REST().setToken(TOKEN);

const commands = new Collection<string, ICommand>();

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
  console.log(`\x1b[32m \x1b[0m logged in as ${client.user?.tag}`);
  console.log(`client in ${client.guilds.cache.size} servers`);
});

client.on("guildCreate", async (guild) => {
  setActivity(client);
  const embed = new EmbedBuilder()
    .setTitle(`${emojis.list} Welcome to Pyrite Bot`)
    .setDescription(`${emojis.reply1} Thank you for choosing **Pyrite Bot**, I will make sure to try my best to protect your server from raider's, spammer's and so much more.
   
You can configure me on the dashboard below this message. Need more servers protected? Add me to any server you think needs protection!
`)
    .setColor(0x2b2d31)
    .setImage("attachment://pyritebot.png");
  
  const owner = await guild.fetchOwner();
  await owner
    .send({
      embeds: [embed],
      files: [
        new AttachmentBuilder(join(process.cwd(), "./assets/pyritebot.png")),
      ],
      components: [buttons],
    })
    .catch(() => {});
});

client.on("guildDelete", () => setActivity(client));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  await command?.run(interaction);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "lockdown_continue") return;

  if (!interaction.inGuild()) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("This command can only be run on a server!")],
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
          c.permissionOverwrites.edit(role.id, { SendMessages: false })
        );
    });

    const lockdownEmbed = new EmbedBuilder()
      .setTitle(`${emojis.lock} Lockdown`)
      .setDescription(`${emojis.reply1} This server is currently on lockdown. Meaning no one can chat in this server. Please wait until the owners unlock the server.`)
      .setColor(0x2b2d31)
      .setTimestamp(new Date())
      .setFooter({
        iconURL: interaction.guild?.iconURL() ?? "",
        text: interaction.guild?.name ?? ""
      })

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
});

const loadCommands = async () => {
  const files = await readdir(join(dir, "./commands"));
  files
    .filter((file) => file.endsWith(".js"))
    .forEach(async (file) => {
      const { default: Command }: { default: new () => ICommand } =
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
      const { default: Event }: { default: new () => IEvent } = await import(
        join(dir, `./events/${file}`)
      );
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
