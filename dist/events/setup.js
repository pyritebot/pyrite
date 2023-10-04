"use strict";
import {
  PermissionFlagsBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import {
  optionButtons,
  successEmbedBuilder,
  getQuarantine,
  errorEmbedBuilder
} from "../utils.js";
import prisma from "../database.js";
export default class Setup {
  name = Events.InteractionCreate;
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f;
    if (!interaction.isButton())
      return;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    if (interaction.customId === "antispam_yes") {
      await interaction.deferReply();
      await prisma.guild.upsert({
        where: { guild: interaction.guildId },
        update: { antiSpam: true },
        create: { guild: interaction.guildId, antiSpam: true }
      });
    } else if (interaction.customId === "antispam_no") {
      await interaction.deferReply();
      await prisma.guild.update({
        where: { guild: interaction.guildId },
        data: { antiSpam: false }
      });
    }
    if (interaction.customId === "antispam_yes" || interaction.customId === "antispam_no") {
      const embed = new EmbedBuilder({
        title: ":speech_balloon: Anti Toxicity",
        description: "<:reply:1067159718646263910> Would you like to use our anti toxicity system to mantain a PG-13 environment in the server?",
        color: 2829617
      });
      await interaction.editReply({
        embeds: [embed],
        components: [optionButtons("antitoxicity")]
      });
    }
    if (interaction.customId === "antitoxicity_yes") {
      await interaction.deferReply();
      await prisma.guild.upsert({
        where: { guild: interaction.guildId },
        update: { toxicityFilter: true },
        create: { guild: interaction.guildId, toxicityFilter: true }
      });
    } else if (interaction.customId === "antitoxicity_no") {
      await interaction.deferReply();
      await prisma.guild.update({
        where: { guild: interaction.guildId },
        data: { toxicityFilter: false }
      });
    }
    if (interaction.customId === "antitoxicity_yes" || interaction.customId === "antitoxicity_no") {
      const embed = new EmbedBuilder({
        title: ":scroll: Logger",
        description: "<:reply:1067159718646263910> Would you like to use the logger to know how your moderators use this bot?",
        color: 2829617
      });
      await interaction.editReply({
        embeds: [embed],
        components: [optionButtons("logger")]
      });
    }
    if (interaction.customId === "logger_yes") {
      await interaction.deferReply();
      const logsChannel = await ((_a = interaction.guild) == null ? void 0 : _a.channels.create({
        name: "logs",
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      }));
      await prisma.guild.upsert({
        where: { guild: interaction.guildId },
        update: { logs: logsChannel == null ? void 0 : logsChannel.id },
        create: { guild: interaction.guildId, logs: logsChannel == null ? void 0 : logsChannel.id }
      });
    } else if (interaction.customId === "logger_no") {
      await interaction.deferReply();
      await prisma.guild.update({
        where: { guild: interaction.guildId },
        data: { logs: null }
      });
    }
    if (interaction.customId === "logger_yes" || interaction.customId === "logger_no") {
      const embed = new EmbedBuilder({
        title: "<:check:1027354811164786739> Verification",
        description: "<:reply:1067159718646263910> Would you also like to set up verification in this server? (this will create a members role and verification channel, if you want to customize it use the </verification:1073740081594122273> and </whitelist:1073740081594122277> commands), please note that setting up verification will remove permissions from everyone role.",
        color: 2829617
      });
      await interaction.editReply({
        embeds: [embed],
        components: [optionButtons("verification")]
      });
    }
    if (interaction.customId === "verification_yes") {
      await interaction.deferReply();
      const channel = await ((_b = interaction.guild) == null ? void 0 : _b.channels.create({
        name: "verify-here"
      }));
      const quarantine = await getQuarantine(interaction == null ? void 0 : interaction.guild);
      (_c = interaction.guild) == null ? void 0 : _c.channels.cache.forEach(async (ch) => {
        var _a2;
        const c = ch;
        await ((_a2 = c.permissionOverwrites) == null ? void 0 : _a2.edit(quarantine, { ViewChannel: false }));
      });
      (_d = channel == null ? void 0 : channel.permissionOverwrites) == null ? void 0 : _d.edit(quarantine, {
        ViewChannel: true,
        SendMessages: false
      });
      (_e = channel == null ? void 0 : channel.permissionOverwrites) == null ? void 0 : _e.edit(interaction.guildId, {
        ViewChannel: false
      });
      const verificationButtons = new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            label: "Verify",
            style: ButtonStyle.Success,
            custom_id: "verify"
          }),
          new ButtonBuilder({
            label: "Help",
            style: ButtonStyle.Link,
            url: "https://discord.gg/NxJzWWqhdQ"
          })
        ]
      });
      const verificationEmbed = new EmbedBuilder({
        title: "<:check:1027354811164786739> Verification",
        description: `<:blank:1008721958210383902> <:arrow:1068604670764916876> To access \`${(_f = interaction.guild) == null ? void 0 : _f.name}\` you must complete the verification process. 
<:blank:1008721958210383902><:blank:1008721958210383902><:reply:1067159718646263910> Press on the **Verify** button below.`,
        color: 2829617
      });
      await (channel == null ? void 0 : channel.send({
        embeds: [verificationEmbed],
        components: [verificationButtons]
      }));
    } else if (interaction.customId === "verification_no") {
      await interaction.deferReply();
    }
    if (interaction.customId === "verification_yes" || interaction.customId === "verification_no") {
      const embed = new EmbedBuilder({
        title: "<:check:1027354811164786739> Anti Raid",
        description: "<:reply:1067159718646263910> Perfect!, would you like to activate the Anti Raid Sytem?",
        color: 2829617
      });
      await interaction.editReply({
        embeds: [embed],
        components: [optionButtons("antiraid")]
      });
    }
    if (interaction.customId === "antiraid_yes") {
      await interaction.deferReply();
      await prisma.guild.upsert({
        where: { guild: interaction.guildId },
        update: { antiRaid: true },
        create: { guild: interaction.guildId, antiRaid: true }
      });
    } else if (interaction.customId === "antiraid_no") {
      await interaction.deferReply();
    }
    if (interaction.customId === "antiraid_yes" || interaction.customId === "antiraid_no") {
      await interaction.editReply({
        embeds: [
          successEmbedBuilder(
            `Setup complete! Deleting this channel <t:${Math.floor(Date.now() / 1e3) + 5}:R>.`
          )
        ]
      });
      setTimeout(async () => {
        var _a2;
        await ((_a2 = interaction.channel) == null ? void 0 : _a2.delete());
      }, 5e3);
    }
  }
}
//# sourceMappingURL=setup.js.map
