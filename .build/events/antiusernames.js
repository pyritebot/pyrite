import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiLinks {
  constructor() {
    this.name = Events.GuildMemberAdd;
  }
  async run(member) {
    var _a, _b;
    const guild = await prisma.guild.findUnique({
      where: { guild: (_a = member.guild) == null ? void 0 : _a.id },
      select: { logs: true, antiLinks: true }
    });
    if (!(guild == null ? void 0 : guild.antiLinks))
      return;
    const username = member.user.username;
    if (username.includes("discord.gg/") || username.includes("dsc.gg/") || username.includes(".gg/") || username.includes("gg/") || username.includes("discord.com/invite/")) {
      const logs = (_b = member.guild) == null ? void 0 : _b.channels.cache.get(guild == null ? void 0 : guild.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has a self promote username!`,
          reason: `Self promote is not allowed in this server!`
        })
      ));
      await member.kick("self promote username");
    }
  }
}
//# sourceMappingURL=antiusernames.js.map
