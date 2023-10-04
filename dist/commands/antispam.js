"use strict";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
  defaultError,
  successEmbedBuilder,
  errorEmbedBuilder,
  logBuilder
} from "../utils.js";
import prisma from "../database.js";
export default class AntiSpam {
  data = new SlashCommandBuilder().setName("antispam").setDescription("Toggle Anti Spam in your server!").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand(
    (subcommand) => subcommand.setName("on").setDescription("turn anti spam on!")
  ).addSubcommand(
    (subcommand) => subcommand.setName("off").setDescription("turn anti spam off!")
  ).addSubcommand(
    (subcommand) => subcommand.setName("set").setDescription("Set the different limits of the antispam filter").addIntegerOption(
      (option) => option.setName("minutes").setDescription(
        "You can pass an integer which will the determines the minutes of the mute"
      )
    ).addIntegerOption(
      (option) => option.setName("limit").setDescription(
        "You can pass an integer which will the determines the amount of messages before a mute"
      )
    )
  );
  async run(interaction) {
    var _a, _b, _c, _d;
    try {
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
            where: {
              guild: interaction.guildId
            },
            select: {
              logs: true
            },
            update: {
              antiSpam: true
            },
            create: {
              guild: interaction.guildId,
              antiSpam: true
            }
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                "anti spam filter has been activated successfully!"
              )
            ]
          });
          const onLogs = (_a = interaction.guild) == null ? void 0 : _a.channels.cache.get(
            (onGuild == null ? void 0 : onGuild.logs) ?? ""
          );
          await (onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              reason: `anti-spam feature has been activated by ${interaction.user.tag}`
            })
          ));
          break;
        case "off":
          const offGuild = await prisma.guild.upsert({
            where: {
              guild: interaction.guildId
            },
            select: {
              logs: true
            },
            update: {
              antiSpam: false
            },
            create: {
              guild: interaction.guildId,
              antiSpam: false
            }
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                "anti spam filter has been deactivated successfully!"
              )
            ]
          });
          const offLogs = (_b = interaction.guild) == null ? void 0 : _b.channels.cache.get(
            (offGuild == null ? void 0 : offGuild.logs) ?? ""
          );
          await (offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              reason: `anti-spam feature has been deactivated by ${interaction.user.tag}`
            })
          ));
          break;
        case "set":
          const minutes = interaction.options.getInteger("minutes");
          const limit = interaction.options.getInteger("limit");
          if (minutes) {
            const minGuild = await prisma.guild.upsert({
              where: {
                guild: interaction.guildId
              },
              select: {
                logs: true
              },
              update: {
                spamMinutes: minutes
              },
              create: {
                guild: interaction.guildId,
                spamMinutes: minutes
              }
            });
            const minLogs = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(
              (minGuild == null ? void 0 : minGuild.logs) ?? ""
            );
            await (minLogs == null ? void 0 : minLogs.send(
              logBuilder({
                member: interaction.member,
                reason: `anti-spam minutes has been changed by ${interaction.user.tag}`
              })
            ));
          }
          if (limit) {
            const limitGuild = await prisma.guild.upsert({
              where: {
                guild: interaction.guildId
              },
              select: {
                logs: true
              },
              update: {
                spamMessageLimit: limit
              },
              create: {
                guild: interaction.guildId,
                spamMessageLimit: limit
              }
            });
            const limitLogs = (_d = interaction.guild) == null ? void 0 : _d.channels.cache.get(
              (limitGuild == null ? void 0 : limitGuild.logs) ?? ""
            );
            await (limitLogs == null ? void 0 : limitLogs.send(
              logBuilder({
                member: interaction.member,
                reason: `anti-spam message limit has been changed by ${interaction.user.tag}`
              })
            ));
          }
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                "Your settings have been saved successfully!"
              )
            ]
          });
      }
    } catch {
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=antispam.js.map
