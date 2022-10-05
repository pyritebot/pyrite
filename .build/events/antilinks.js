import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiLinks {
  constructor() {
    this.name = Events.MessageCreate;
  }
  async run(message) {
    var _a;
    if (!message.inGuild())
      return;
    const guild = await prisma.guild.findUnique({
      where: { guild: message.guildId },
      select: { logs: true, antiLinks: true }
    });
    if (!(guild == null ? void 0 : guild.antiLinks))
      return;
    if (message.content.includes("discord.gg/") || message.content.includes("dsc.gg/") || message.content.includes(".gg/") || message.content.includes("gg/") || message.content.includes("discord.com/invite/")) {
      await message.delete();
      const logs = (_a = message.guild) == null ? void 0 : _a.channels.cache.get(guild == null ? void 0 : guild.logs);
      await (logs == null ? void 0 : logs.send(logBuilder({
        member: message.member,
        content: `${message.author} has tried to self promote a server!`,
        reason: `Self promote is not allowed in this server!`
      })));
    }
  }
}
//# sourceMappingURL=antilinks.js.map
