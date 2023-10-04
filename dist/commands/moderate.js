"use strict";
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder, buttons, logBuilder } from "../utils.js";
import { nanoid } from "nanoid/non-secure";
import prisma from "../database.js";
export default class Moderate {
  data = new SlashCommandBuilder().setName("modnick").setNameLocalizations({ "es-ES": "moderar-apodo" }).setDescription("Moderate a users name to one that can be mentioned!").setDescriptionLocalizations({
    "es-ES": "Cambia el nombre de usuario a uno que pueda ser mencionado!"
  }).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames).addUserOption(
    (option) => option.setName("user").setNameLocalizations({ "es-ES": "usuario" }).setDescription("You can pass a mention or an id of a user.").setDescriptionLocalizations({
      "es-ES": "Puedes pasar una menci\xF3n o un id de un usuario"
    }).setRequired(true)
  );
  async run(interaction) {
    var _a, _b, _c, _d, _e;
    const member = interaction.options.getMember("user");
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    if (!member) {
      await interaction.reply({
        embeds: [errorEmbedBuilder("That user is not on this server!")]
      });
      return;
    }
    if (!((_d = (_c = (_b = (_a = interaction.guild) == null ? void 0 : _a.members) == null ? void 0 : _b.me) == null ? void 0 : _c.permissions) == null ? void 0 : _d.has(
      PermissionFlagsBits.ManageNicknames
    ))) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder(
            "The bot doesn't have permissions to manage member's nicknames!"
          )
        ],
        ephemeral: true
      });
      return;
    }
    try {
      await member.setNickname(
        `Moderated ${nanoid(12)}`,
        "Username/Nickname could not be mentioned"
      );
      await interaction.reply({
        embeds: [successEmbedBuilder(`Moderated ${member}'s username!`)],
        ephemeral: true
      });
      const guild = await prisma.guild.findUnique({
        where: { guild: interaction.guildId },
        select: { logs: true }
      });
      const logs = (_e = interaction.guild) == null ? void 0 : _e.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      logs == null ? void 0 : logs.send(
        logBuilder({
          member: interaction.member,
          reason: `${member.user} nickname moderated`
        })
      );
    } catch {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("Can't moderate this user's nickname, if this problem persists, please contact support")
        ],
        components: [buttons],
        ephemeral: true
      });
    }
  }
}
//# sourceMappingURL=moderate.js.map
