"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class Kick {
  name = Events.GuildMemberRemove;
  static times = 0;
  static timeout = setTimeout(() => {
    Kick.times = 0;
  }, 8e3);
  async run(member) {
    var _a, _b, _c, _d, _e;
    const guild = await prisma.guild.findUnique({
      where: { guild: member.guild.id },
      select: { antiRaid: true, logs: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    Kick.times++;
    Kick.timeout.refresh();
    if (Kick.times % 5 === 0) {
      const auditLogFetch = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick
      });
      const log = auditLogFetch.entries.first();
      if (!log)
        return;
      if (log.createdAt < (member.joinedAt ?? /* @__PURE__ */ new Date()))
        return;
      if (((_a = log.target) == null ? void 0 : _a.id) !== member.id)
        return;
      if (((_b = member.client.user) == null ? void 0 : _b.id) === ((_c = log.executor) == null ? void 0 : _c.id))
        return;
      const executor = await member.guild.members.fetch(
        ((_d = log == null ? void 0 : log.executor) == null ? void 0 : _d.id) ?? ""
      );
      const quarantine = await getQuarantine(member.guild);
      executor.roles.cache.filter((r) => r.id !== member.guild.id).forEach(async (r) => {
        await executor.roles.remove(r, "Kicking too many users").catch(async () => {
          if (!executor.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      if (quarantine) {
        await executor.roles.add(quarantine, "Kicking too many users");
      }
      await executor.timeout(1440 * 6e4, "Kicking too many users").catch(() => {
      });
      const logs = (_e = member.guild) == null ? void 0 : _e.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many users kicked."
        })
      ));
    }
  }
}
//# sourceMappingURL=kick.js.map
