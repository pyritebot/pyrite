"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class RoleDeletions {
  name = Events.GuildRoleDelete;
  static times = 0;
  static timeout = setTimeout(() => {
    RoleDeletions.times = 0;
  }, 8e3);
  async run(role) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: role.guild.id },
      select: { antiRaid: true, logs: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    RoleDeletions.times++;
    RoleDeletions.timeout.refresh();
    if (RoleDeletions.times % 5 === 0) {
      const auditLogFetch = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete
      });
      const log = auditLogFetch.entries.first();
      if (((_a = role.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await role.guild.members.fetch(((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id) ?? "");
      const quarantine = await getQuarantine(role.guild);
      member.roles.cache.filter((r) => r.id !== role.guild.id).forEach(async (r) => {
        await member.roles.remove(r, "Deleting too many roles").catch(async () => {
          if (!member.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      if (quarantine) {
        await member.roles.add(quarantine, "Deleting too many roles");
      }
      await member.timeout(1440 * 6e4, "Deleting too many roles").catch(() => {
      });
      const logs = (_d = member.guild) == null ? void 0 : _d.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many roles deleting."
        })
      ));
    }
  }
}
//# sourceMappingURL=roleDelete.js.map
