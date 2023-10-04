"use strict";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  EmbedBuilder,
  Colors,
  ActivityType
} from "discord.js";
import { google } from "googleapis";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import prisma from "./database.js";
import emojis from "./emojis.js";
export const dir = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_API_KEY;
export const setActivity = (client) => {
  var _a;
  (_a = client.user) == null ? void 0 : _a.setActivity(
    `${client.guilds.cache.size} ${client.guilds.cache.size !== 1 ? "servers" : "server"} | /setup`,
    {
      type: ActivityType.Watching
    }
  );
};
export const timeSince = (date) => {
  var _a;
  const now = /* @__PURE__ */ new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1e3;
  if (secondsPast < 60) {
    return `${secondsPast}s`;
  } else if (secondsPast < 3600) {
    return `${secondsPast / 60}m`;
  } else if (secondsPast <= 86400) {
    return `${secondsPast / 3600}h`;
  } else if (secondsPast > 86400) {
    const day = date.getDate();
    const month = (_a = date.toDateString().match(/ [a-zA-Z]*/)) == null ? void 0 : _a[0].replace(" ", "");
    const year = date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;
    return `${day} ${month}${year}`;
  }
};
export const loadImage = async (image) => {
  const res = await fetch(image);
  return Buffer.from(await res.arrayBuffer());
};
export const getQuarantine = async (guild) => {
  const oldGuild = await prisma.guild.findUnique({
    where: { guild: guild.id },
    select: { quarantine: true }
  });
  const quarantine = guild.roles.cache.get((oldGuild == null ? void 0 : oldGuild.quarantine) ?? "");
  if (!quarantine) {
    const role = await guild.roles.create({
      name: "Quarantine"
    });
    role == null ? void 0 : role.setPermissions([]);
    await prisma.guild.upsert({
      where: { guild: guild == null ? void 0 : guild.id },
      update: { quarantine: role == null ? void 0 : role.id },
      create: {
        guild: guild.id,
        quarantine: role.id
      }
    });
    return role;
  }
  return quarantine;
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
  description: `${emojis.error}  ${message}`,
  color: Colors.DarkRed
});
export const successEmbedBuilder = (message) => new EmbedBuilder({
  description: `${emojis.check}  ${message}`,
  color: Colors.Green
});
export const warnEmbedBuilder = (message) => new EmbedBuilder({
  description: `${emojis.warn}  ${message}`,
  color: Colors.Yellow
});
export const logBuilder = ({
  member,
  guild,
  reason,
  punished = false
}) => {
  var _a, _b;
  const embed = new EmbedBuilder({
    title: "<:warn:1027361416119853187> New Alert",
    description: `
  <:reply:1067159718646263910> A new Moderator action was just logged below :
  
<:arrow:1068604670764916876> **Executor:** ${(member == null ? void 0 : member.user) ?? `<@${member}>`}
<:arrow:1068604670764916876> **Reason:** ${reason}
<:arrow:1068604670764916876> **Punished:** \`${punished ? "Yes" : "No"}\`
<:arrow:1068604670764916876> **Time:** <t:${Math.floor(Date.now() / 1e3)}:R>`,
    footer: {
      text: ((_a = member == null ? void 0 : member.guild) == null ? void 0 : _a.name) ?? (guild == null ? void 0 : guild.name),
      icon_url: ((_b = member == null ? void 0 : member.guild) == null ? void 0 : _b.iconURL()) ?? (guild == null ? void 0 : guild.iconURL()) ?? void 0
    },
    thumbnail: {
      url: (member == null ? void 0 : member.user.displayAvatarURL()) ?? ""
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    color: 2829617
  });
  return {
    embeds: [embed]
  };
};
export const punishButtons = (id) => new ActionRowBuilder({
  components: [
    new ButtonBuilder({
      custom_id: `punish_kick-${id}`,
      label: "Kick",
      style: ButtonStyle.Danger
    }),
    new ButtonBuilder({
      custom_id: `punish_ban-${id}`,
      label: "Ban",
      style: ButtonStyle.Danger
    }),
    new ButtonBuilder({
      custom_id: `punish_quarantine-${id}`,
      label: "Quarantine",
      style: ButtonStyle.Secondary
    })
  ]
});
export const addWarn = async (interaction) => {
  var _a, _b, _c;
  const member = interaction.options.getMember("member");
  const reason = interaction.options.getString("reason", true);
  if (!member) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("Couldn't find that member!")],
      ephemeral: true
    });
    return;
  }
  if (member.user.bot) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("You cannot warn a bot!")],
      ephemeral: true
    });
    return;
  }
  if (member.user.id === interaction.user.id) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("You cannot warn yourself!")],
      ephemeral: true
    });
    return;
  }
  if (member.user.id === member.guild.ownerId) {
    await interaction.reply({
      embeds: [errorEmbedBuilder("You cannot warn the owner of the server!")],
      ephemeral: true
    });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const guild2 = await prisma.guild.findUnique({
      where: { guild: interaction.guildId ?? "" },
      select: { mods: true, admins: true, owners: true }
    });
    const roles = (_a = interaction.member) == null ? void 0 : _a.roles;
    if (!(roles.cache.has((guild2 == null ? void 0 : guild2.mods) ?? "") || (guild2 == null ? void 0 : guild2.admins.includes(interaction.user.id)) || (guild2 == null ? void 0 : guild2.owners.includes(interaction.user.id)) || interaction.user.id === ((_b = interaction.guild) == null ? void 0 : _b.ownerId))) {
      await interaction.editReply({
        embeds: [
          errorEmbedBuilder("You don't have permission to warn members!")
        ]
      });
      return;
    }
    if ((guild2 == null ? void 0 : guild2.admins.includes(member.user.id)) && interaction.user.id !== member.guild.ownerId) {
      await interaction.editReply({
        embeds: [errorEmbedBuilder("You cannot warn an admin!")]
      });
      return;
    }
    await prisma.warn.create({
      data: {
        userId: member.user.id,
        guildId: interaction.guildId ?? "",
        reason
      }
    });
  } catch (err) {
    console.error(err);
    await interaction.editReply(defaultError);
    return;
  }
  await member.send({
    embeds: [
      warnEmbedBuilder(
        `You have been warned in **${member.guild.name}** for **${reason}**!`
      )
    ]
  }).catch(() => {
  });
  await interaction.editReply({
    embeds: [
      successEmbedBuilder(
        `${member.user} was successfully warned for **${reason}**!`
      )
    ]
  });
  const guild = await prisma.guild.findUnique({
    where: { guild: interaction.guildId ?? "" },
    select: { logs: true }
  });
  const logs = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(
    (guild == null ? void 0 : guild.logs) ?? ""
  );
  await (logs == null ? void 0 : logs.send(
    logBuilder({
      member: interaction.member,
      reason: `${member.user.tag} has been warned by ${interaction.user.tag}: ${reason}`
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
  files: [
    new AttachmentBuilder(join(process.cwd(), "./assets/error.gif"), {
      name: "error.gif",
      description: "It seems you stumbled upon an unknown error!, if the problem persists, do not doubt to contact us our support server."
    })
  ],
  components: [buttons],
  ephemeral: true
};
//# sourceMappingURL=utils.js.map
