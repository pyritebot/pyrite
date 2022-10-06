import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder, Colors, ActivityType } from "discord.js";
import fetch from "node-fetch";
import { google } from "googleapis";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import prisma from "./database.js";
export const dir = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_API_KEY;
export const setActivity = (client) => {
  var _a;
  (_a = client.user) == null ? void 0 : _a.setActivity(`${client.guilds.cache.size} ${client.guilds.cache.size !== 1 ? "servers" : "server"} | /setup`, {
    type: ActivityType.Watching
  });
};
export const loadImage = async (image) => {
  const res = await fetch(image);
  return Buffer.from(await res.arrayBuffer());
};
export const analyzeText = async (text) => {
  const DISCOVERY_URL = "https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1";
  const analyzeRequest = {
    comment: { text },
    requestedAttributes: {
      TOXICITY: {}
    }
  };
  const client = await google.discoverAPI(DISCOVERY_URL);
  const response = await client.comments.analyze({
    key: API_KEY,
    resource: analyzeRequest
  });
  return response.data.attributeScores.TOXICITY.summaryScore.value * 100;
};
export const buttons = new ActionRowBuilder({
  components: [
    new ButtonBuilder({
      label: "Invite Me",
      style: ButtonStyle.Link,
      url: "https://discord.com/oauth2/authorize?client_id=1008400801628164096&permissions=8&scope=bot%20applications.commands"
    }),
    new ButtonBuilder({
      label: "Support Server",
      style: ButtonStyle.Link,
      url: "https://discord.gg/NxJzWWqhdQ"
    }),
    new ButtonBuilder({
      label: "Website",
      style: ButtonStyle.Link,
      url: "https://pyritebot.netlify.app/"
    })
  ]
});
export const errorEmbedBuilder = (message) => new EmbedBuilder({
  description: `<:error:1027359606126690344>  ${message}`,
  color: Colors.DarkRed
});
export const successEmbedBuilder = (message) => new EmbedBuilder({
  description: `<:check:1027354811164786739>  ${message}`,
  color: Colors.Green
});
export const warnEmbedBuilder = (message) => new EmbedBuilder({
  description: `<:warn:1027361416119853187>  ${message}`,
  color: Colors.Yellow
});
export const logBuilder = ({ member, content, reason }) => {
  const embed = new EmbedBuilder({
    description: `<:arrow:1009057573590290452> ${content} 
 <:arrow:1009057573590290452> **Executor:** ${member.user} 
 <:arrow:1009057573590290452> **Reason:** **\`${reason}\`**
 <:arrow:1009057573590290452> **Time:** <t:${Math.floor(Date.now() / 1e3)}:R> `,
    author: {
      name: member.user.tag,
      icon_url: member.user.displayAvatarURL()
    },
    footer: {
      text: member.guild.name,
      icon_url: member.guild.iconURL()
    },
    timestamp: new Date().toISOString(),
    color: Colors.Blurple
  });
  return {
    embeds: [embed]
  };
};
export const addReport = async (interaction) => {
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.get("reason", true).value;
  const file = interaction.options.get("image", true).attachment;
  if ((user == null ? void 0 : user.id) === interaction.user.id) {
    await interaction.reply({ embeds: [errorEmbedBuilder("You can't report yourself!")] });
    return;
  }
  const reportSubmittedEmbed = new EmbedBuilder({
    title: "<:check:1008718056891101194> Report Submitted",
    description: `Your report was submitted and our staff team will be looking into it.
Thank you for submitting this report. For more updates please join our support server below. Please also keep your DMS on so we can easly send you feedback.`,
    color: Colors.Blurple
  });
  await interaction.reply({
    embeds: [reportSubmittedEmbed],
    components: [
      new ActionRowBuilder({
        components: [new ButtonBuilder({ label: "Support Server", style: ButtonStyle.Link, url: "https://discord.gg/NxJzWWqhdQ" })]
      })
    ],
    ephemeral: true
  });
  const channel = interaction.client.channels.cache.get("1022909267440828466");
  await (channel == null ? void 0 : channel.send({
    embeds: [
      new EmbedBuilder({
        color: Colors.Blurple,
        title: "<:arrow:1009057573590290452> New Report!",
        description: `<:1412reply:1009087336828649533>*New report for ${user}* 

 **Reason:** ${reason}`,
        image: {
          url: "attachment://report.png"
        }
      })
    ],
    files: [new AttachmentBuilder(file == null ? void 0 : file.url, { name: "report.png" })],
    components: [
      new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            custom_id: `report_approve-${reason}-${user == null ? void 0 : user.id}`,
            label: "Approve",
            style: ButtonStyle.Success
          }),
          new ButtonBuilder({
            custom_id: `report_reject`,
            label: "Ignore",
            style: ButtonStyle.Danger
          })
        ]
      })
    ]
  }));
};
export const addWarn = async (interaction) => {
  var _a, _b, _c;
  const member = interaction.options.getMember("member");
  const reason = interaction.options.get("reason", true).value;
  if (!member) {
    await interaction.reply({ embeds: [errorEmbedBuilder("Couldn't find that member!")], ephemeral: true });
    return;
  }
  if (member.user.bot) {
    await interaction.reply({ embeds: [errorEmbedBuilder("You cannot warn a bot!")], ephemeral: true });
    return;
  }
  if (member.user.id === interaction.user.id) {
    await interaction.reply({ embeds: [errorEmbedBuilder("You cannot warn yourself!")], ephemeral: true });
    return;
  }
  if (member.user.id === member.guild.ownerId) {
    await interaction.reply({ embeds: [errorEmbedBuilder("You cannot warn the owner of the server!")], ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const guild2 = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { mods: true, admins: true, owners: true }
    });
    const roles = (_a = interaction.member) == null ? void 0 : _a.roles;
    if (!(roles.cache.has(guild2 == null ? void 0 : guild2.mods) || (guild2 == null ? void 0 : guild2.admins.includes(interaction.user.id)) || (guild2 == null ? void 0 : guild2.owners.includes(interaction.user.id)) || interaction.user.id === ((_b = interaction.guild) == null ? void 0 : _b.ownerId))) {
      await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to warn members!")] });
      return;
    }
    if ((guild2 == null ? void 0 : guild2.admins.includes(member.user.id)) && interaction.user.id !== member.guild.ownerId) {
      await interaction.editReply({ embeds: [errorEmbedBuilder("You cannot warn an admin!")] });
      return;
    }
    await prisma.user.upsert({
      where: { user: member.user.id },
      update: {
        warns: {
          push: { guild: interaction.guildId, reason }
        }
      },
      create: {
        user: member.user.id,
        warns: [{ guild: interaction.guildId, reason }]
      }
    });
  } catch {
    await interaction.editReply(defaultError);
    return;
  }
  await member.send({ embeds: [warnEmbedBuilder(`You have been warned in **${member.guild.name}** for **${reason}**!`)] });
  await interaction.editReply({ embeds: [successEmbedBuilder(`${member.user} was successfully warned for **${reason}**!`)] });
  const guild = await prisma.guild.findUnique({
    where: { guild: interaction.guildId },
    select: { logs: true }
  });
  const logs = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(guild == null ? void 0 : guild.logs);
  await (logs == null ? void 0 : logs.send(
    logBuilder({
      member: interaction.member,
      content: `${member.user} has been warned by ${interaction.user}`,
      reason
    })
  ));
};
export const optionButtons = (id) => new ActionRowBuilder({
  components: [
    new ButtonBuilder({
      label: "Yes",
      style: ButtonStyle.Primary,
      custom_id: `${id}_yes`
    }),
    new ButtonBuilder({
      label: "No",
      style: ButtonStyle.Danger,
      custom_id: `${id}_no`
    })
  ]
});
export const defaultError = {
  files: [new AttachmentBuilder(join(process.cwd(), "./assets/defaultError.png"), { name: "error.png" })],
  components: [buttons],
  ephemeral: true
};
//# sourceMappingURL=utils.js.map
