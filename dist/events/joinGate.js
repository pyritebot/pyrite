"use strict";
import { Events, EmbedBuilder } from "discord.js";
import prisma from "../database.js";
import emojis from "../emojis.js";
export default class JoinGate {
  name = Events.GuildMemberAdd;
  async run(member) {
    const guild = await prisma.guild.findUnique({
      where: { guild: member.guild.id },
      select: { raidMode: true }
    });
    if (!(guild == null ? void 0 : guild.raidMode))
      return;
    const raidModeEmbed = new EmbedBuilder({
      author: {
        name: member.guild.name,
        icon_url: member.guild.iconURL() ?? ""
      },
      description: `${emojis.arrow} **Join Gate** is currently active in this server. Meaning no one can join at the moment.`,
      color: 3092790
    });
    await member.send({ embeds: [raidModeEmbed] });
    await member.kick("Join Gate System");
  }
}
//# sourceMappingURL=joinGate.js.map
