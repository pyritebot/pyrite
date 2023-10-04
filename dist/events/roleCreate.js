"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class RoleCreations {
  name = Events.GuildRoleCreate;
  static times = 0;
  static roles = [];
  static timeout = setTimeout(() => {
    RoleCreations.times = 0;
    RoleCreations.roles = [];
  }, 5e3);
  async run(role) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: role.guild.id },
      select: { antiRaid: true, logs: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    RoleCreations.roles.push(role.id);
    RoleCreations.times++;
    RoleCreations.timeout.refresh();
    if (RoleCreations.times % 5 === 0) {
      const auditLogFetch = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleCreate
      });
      const log = auditLogFetch.entries.first();
      if (((_a = role.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await role.guild.members.fetch(((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id) ?? "");
      const quarantine = await getQuarantine(role.guild);
      member.roles.cache.filter((r) => r.id !== role.guild.id).forEach(async (r) => {
        await member.roles.remove(r, "Creating too many roles").catch(async () => {
          if (!member.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      if (quarantine) {
        await member.roles.add(quarantine, "Creating too many roles");
      }
      await member.timeout(1440 * 6e4, "Creating too many roles").catch(() => {
      });
      RoleCreations.roles.forEach(async (r) => {
        var _a2;
        const rl = await role.guild.roles.fetch(r);
        await ((_a2 = rl == null ? void 0 : rl.delete()) == null ? void 0 : _a2.catch(() => {
        }));
      });
      const logs = (_d = member.guild) == null ? void 0 : _d.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many roles created."
        })
      ));
    }
  }
}
//# sourceMappingURL=roleCreate.js.map
