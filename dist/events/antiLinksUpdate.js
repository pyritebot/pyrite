"use strict";
import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiLinks {
  name = Events.MessageUpdate;
  async run(_, message) {
    var _a;
    if (!message.inGuild())
      return;
    const guild = await prisma.guild.findUnique({
      where: { guild: message.guildId },
      select: { logs: true, antiLinks: true }
    });
    if (!(guild == null ? void 0 : guild.antiLinks))
      return;
    if (message.content.includes("discord.gg/") || message.content.includes("dsc.gg/") || message.content.includes("discord.com/invite/")) {
      await message.delete();
      const logs = (_a = message.guild) == null ? void 0 : _a.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          // rome-ignore lint/style/noNonNullAssertion: Member will always be defined.
          member: message.member,
          reason: "Self promote is not allowed in this server!"
        })
      ));
    }
  }
}
//# sourceMappingURL=antiLinksUpdate.js.map
