"use strict";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
  successEmbedBuilder,
  errorEmbedBuilder,
  logBuilder
} from "../utils.js";
import prisma from "../database.js";
export default class AntiLinks {
  data = new SlashCommandBuilder().setName("antilinks").setDescription(
    "Toggle Anti Links in your server (this will block every self promotion link)!"
  ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand(
    (subcommand) => subcommand.setName("on").setDescription("turn anti links on!")
  ).addSubcommand(
    (subcommand) => subcommand.setName("off").setDescription("turn anti links off!")
  );
  async run(interaction) {
    var _a, _b;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    switch (interaction.options.getSubcommand()) {
      case "on":
        const onGuild = await prisma.guild.upsert({
          where: { guild: interaction.guildId ?? "" },
          update: { antiLinks: true },
          create: { antiLinks: true, guild: interaction.guildId ?? "" }
        });
        await interaction.editReply({
          embeds: [successEmbedBuilder("Anti Links has been turned on!")]
        });
        const onLogs = (_a = interaction.guild) == null ? void 0 : _a.channels.cache.get(
          (onGuild == null ? void 0 : onGuild.logs) ?? ""
        );
        await (onLogs == null ? void 0 : onLogs.send(
          logBuilder({
            member: interaction.member,
            reason: `anti links feature has been activated by ${interaction.user.tag}`
          })
        ));
        break;
      case "off":
        const offGuild = await prisma.guild.upsert({
          where: { guild: interaction.guildId },
          update: { antiLinks: false },
          create: { antiLinks: false, guild: interaction.guildId }
        });
        const offLogs = (_b = interaction.guild) == null ? void 0 : _b.channels.cache.get(
          (offGuild == null ? void 0 : offGuild.logs) ?? ""
        );
        await (offLogs == null ? void 0 : offLogs.send(
          logBuilder({
            member: interaction.member,
            reason: `anti links feature has been deactivated by ${interaction.user.tag}`
          })
        ));
        await interaction.editReply({
          embeds: [successEmbedBuilder("Anti Links has been turned off!")]
        });
        break;
    }
  }
}
//# sourceMappingURL=antilinks.js.map
