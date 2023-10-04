"use strict";
var _a;
import {
  AttachmentBuilder,
  Client,
  Collection,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes
} from "discord.js";
import {
  buttons,
  defaultError,
  dir,
  errorEmbedBuilder,
  setActivity,
  successEmbedBuilder
} from "./utils.js";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import emojis from "./emojis.js";
import prisma from "./database.js";
import Fastify from "fastify";
import { z } from "zod";
const envVariables = z.object({
  TOKEN: z.string(),
  DATABASE_URL: z.string(),
  GOOGLE_API_KEY: z.string()
});
envVariables.parse(process.env);
const TOKEN = process.env.TOKEN;
const rest = new REST().setToken(TOKEN);
const commands = new Collection();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});
client.once("ready", async () => {
  var _a2;
  setActivity(client);
  console.log(`logged in as ${(_a2 = client.user) == null ? void 0 : _a2.tag}`);
  console.log(`client in ${client.guilds.cache.size} servers`);
});
client.on("guildCreate", async (guild) => {
  setActivity(client);
  const embed = new EmbedBuilder({
    title: "<:list:1030927155472904283> Welcome to Pyrite Bot",
    description: `<:reply:1067159718646263910> Thank you for choosing **Pyrite Bot**, I will make sure to try my best to protect your server from raider's, spammer's and so much more.
   
You can configure me on the dashboard below this message. Need more servers protected? Add me to any server you think needs protection!

`,
    color: 2829617,
    image: {
      url: "attachment://pyritebot.png"
    }
  });
  const owner = await guild.fetchOwner();
  await owner.send({
    embeds: [embed],
    files: [
      new AttachmentBuilder(join(process.cwd(), "./assets/pyritebot.png"))
    ],
    components: [buttons]
  }).catch(() => {
  });
});
client.on("guildDelete", () => setActivity(client));
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand())
    return;
  const command = commands.get(interaction.commandName);
  await (command == null ? void 0 : command.run(interaction));
});
client.on("interactionCreate", async (interaction) => {
  var _a2, _b, _c, _d;
  if (!interaction.isButton())
    return;
  if (interaction.customId !== "lockdown_continue")
    return;
  if (!interaction.inGuild()) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("This command can only be run on a server!")]
    });
    return;
  }
  try {
    await interaction.deferReply({ ephemeral: true });
    const channel = await ((_a2 = interaction.guild) == null ? void 0 : _a2.channels.create({
      name: "server-lockdown"
    }));
    (_b = interaction.guild) == null ? void 0 : _b.channels.cache.forEach((ch) => {
      var _a3;
      const c = ch;
      (_a3 = interaction.guild) == null ? void 0 : _a3.roles.cache.filter((role) => role.id !== "@everyone").forEach(
        (role) => c.permissionOverwrites.edit(role.id, { SendMessages: false })
      );
    });
    const lockdownEmbed = new EmbedBuilder({
      title: `${emojis.lock} Lockdown`,
      description: `${emojis.reply1} This server is currently on lockdown. Meaning no one can chat in this server. Please wait until the owners unlock the server.`,
      color: 2829617,
      footer: {
        icon_url: ((_c = interaction.guild) == null ? void 0 : _c.iconURL()) ?? "",
        text: ((_d = interaction.guild) == null ? void 0 : _d.name) ?? ""
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const message = await (channel == null ? void 0 : channel.send({ embeds: [lockdownEmbed] }));
    await prisma.guild.upsert({
      where: { guild: interaction.guildId },
      update: {
        raidMode: true,
        lockdownChannel: channel == null ? void 0 : channel.id,
        lockdownMessage: message == null ? void 0 : message.id
      },
      create: {
        guild: interaction.guildId,
        raidMode: true,
        lockdownChannel: channel == null ? void 0 : channel.id,
        lockdownMessage: message == null ? void 0 : message.id
      }
    });
    await interaction.editReply({
      embeds: [successEmbedBuilder("lockdown was successfully activated")]
    });
  } catch {
    await interaction.editReply(defaultError);
  }
});
const registerCommands = async () => {
  const files = await readdir(join(dir, "./commands"));
  files.filter((file) => file.endsWith(".js")).forEach(async (file) => {
    const { default: Command } = await import(join(dir, `./commands/${file}`));
    const command = new Command();
    commands.set(command.data.name, command);
  });
};
const registerEvents = async () => {
  const files = await readdir(join(dir, "./events"));
  files.filter((file) => file.endsWith(".js")).forEach(async (file) => {
    const { default: Event } = await import(join(dir, `./events/${file}`));
    const event = new Event();
    client.on(event.name, event.run.bind(event));
  });
};
const server = Fastify();
server.get("/", async () => "Bot hosting running correctly!");
try {
  await registerCommands();
  await registerEvents();
  await client.login(TOKEN);
  await server.listen({ port: 3e3, host: "0.0.0.0" });
  await rest.put(Routes.applicationCommands(((_a = client.user) == null ? void 0 : _a.id) ?? ""), {
    body: commands.map(({ data }) => data.toJSON())
  });
} catch (err) {
  console.error(err);
}
//# sourceMappingURL=index.js.map
