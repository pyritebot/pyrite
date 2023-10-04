"use strict";
import { Events } from "discord.js";
import {
  errorEmbedBuilder
} from "../utils.js";
import prisma from "../database.js";
export default class RoleDeletions {
  name = Events.InteractionCreate;
  async run(interaction) {
    var _a, _b, _c;
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
    const [_, memberId] = interaction.customId.split("-");
    const member = await ((_a = interaction.guild) == null ? void 0 : _a.members.fetch(memberId));
    if (!member) {
      await interaction.reply({
        embeds: [errorEmbedBuilder("The member is not in this server")],
        ephemeral: true
      });
      return;
    }
    if (interaction.customId.startsWith("kick_toxic")) {
      await member.kick("toxicity levels higher than normal");
      await interaction.message.delete();
    } else if (interaction.customId.startsWith("ban_toxic")) {
      await member.ban({ reason: "toxicity levels higher than normal" });
      await interaction.message.delete();
    } else if (interaction.customId.startsWith("verify_toxic")) {
      const guild = await prisma.guild.findUnique({
        where: { guild: interaction.guildId },
        select: { members: true }
      });
      const role = (_b = interaction.guild) == null ? void 0 : _b.roles.cache.get((guild == null ? void 0 : guild.members) ?? "");
      if (role) {
        await ((_c = member == null ? void 0 : member.roles) == null ? void 0 : _c.add(role));
      }
      await interaction.message.delete();
    }
  }
}
//# sourceMappingURL=toxic.js.map
