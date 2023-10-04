"use strict";
import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiLinks {
  name = Events.GuildMemberAdd;
  async run(member) {
    var _a;
    const guild = await prisma.guild.findUnique({
      where: { guild: member.guild.id },
      select: { logs: true, antiLinks: true }
    });
    if (!(guild == null ? void 0 : guild.antiLinks))
      return;
    const username = member.user.username;
    if (username.includes("discord.gg/") || username.includes("dsc.gg/") || username.includes(".gg/") || username.includes("gg/") || username.includes("discord.com/invite/")) {
      const logs = (_a = member.guild) == null ? void 0 : _a.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Self promote is not allowed in this server!"
        })
      ));
      await member.kick("self promote username");
    }
  }
}
//# sourceMappingURL=antiUsernames.js.map
