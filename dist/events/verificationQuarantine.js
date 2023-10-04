"use strict";
import { Events } from "discord.js";
import { getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class VerificationQuarantine {
  name = Events.GuildMemberAdd;
  async run(member) {
    if (!member)
      return;
    const guild = await prisma.guild.findUnique({
      where: { guild: member.guild.id },
      select: { verificationChannel: true }
    });
    if (!(guild == null ? void 0 : guild.verificationChannel))
      return;
    const quarantine = await getQuarantine(member.guild);
    if (quarantine) {
      await member.roles.add(quarantine);
    }
  }
}
//# sourceMappingURL=verificationQuarantine.js.map
