"use strict";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
  errorEmbedBuilder,
  successEmbedBuilder,
  warnEmbedBuilder,
  logBuilder
} from "../utils.js";
import prisma from "../database.js";
export default class Kick {
  data = new SlashCommandBuilder().setName("kick").setDescription("Kicks a user from the server.").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(
    (option) => option.setName("user").setDescription("You can pass a mention or an id of a user.").setRequired(true)
  ).addStringOption(
    (option) => option.setName("reason").setDescription(
      "You can pass a string with a reason for kicking the user of the server."
    ).setRequired(true)
  );
  async run(interaction) {
    var _a, _b, _c, _d;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    const member = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason", true);
    if (!((_d = (_c = (_b = (_a = interaction.guild) == null ? void 0 : _a.members) == null ? void 0 : _b.me) == null ? void 0 : _c.permissions) == null ? void 0 : _d.has(
      PermissionFlagsBits.KickMembers
    ))) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder(
            "The bot doesn't have permissions to kick members!"
          )
        ],
        ephemeral: true
      });
      return;
    }
    if (!member) {
      await interaction.reply({
        embeds: [errorEmbedBuilder("Member could not be found!")],
        ephemeral: true
      });
      return;
    }
    const msg = await member.send({
      embeds: [
        warnEmbedBuilder(
          `You have been kicked from **${interaction.guild.name}**!`
        )
      ]
    }).catch(() => {
    });
    try {
      await member.kick(reason);
    } catch {
      await interaction.reply({
        embeds: [errorEmbedBuilder("Cannot kick this member!")],
        ephemeral: true
      });
      await (msg == null ? void 0 : msg.edit({
        embeds: [
          warnEmbedBuilder(
            `${interaction.user} tried to kick you from **${interaction.guild.name}**!`
          )
        ]
      }));
      return;
    }
    await interaction.reply({
      embeds: [
        successEmbedBuilder(
          `${member.user} was kicked from the server for ${reason}`
        )
      ],
      ephemeral: true
    });
    const guild = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { logs: true }
    });
    const logs = interaction.guild.channels.cache.get(
      (guild == null ? void 0 : guild.logs) ?? ""
    );
    await (logs == null ? void 0 : logs.send(
      logBuilder({
        member: interaction.member,
        reason
      })
    ));
  }
}
//# sourceMappingURL=kick.js.map
