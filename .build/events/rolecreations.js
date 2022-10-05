import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _RoleCreations = class {
  constructor() {
    this.name = Events.GuildRoleCreate;
  }
  async run(role) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: role.guild.id },
      select: { antiRaid: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    _RoleCreations.roles.push(role.id);
    _RoleCreations.times++;
    if (_RoleCreations.times >= 5) {
      const auditLogFetch = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
      const log = auditLogFetch.entries.first();
      if (((_a = role.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await role.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      role.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(async (r) => await member.roles.remove(r, "Deleting too many roles").catch(async () => await r.setPermissions([], "Deleting too many roles").catch(() => {
      })));
      _RoleCreations.roles.forEach(async (r) => {
        var _a2;
        return await ((_a2 = role.guild.roles.cache.get(r)) == null ? void 0 : _a2.delete().catch(() => {
        }));
      });
      const guild2 = await prisma.guild.findUnique({
        where: { guild: role.guild.id },
        select: { logs: true }
      });
      const logs = (_d = member.guild) == null ? void 0 : _d.channels.cache.get(guild2 == null ? void 0 : guild2.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for creating too many roles.`,
          reason: `Too many roles created.`
        })
      ));
    }
    setTimeout(() => {
      _RoleCreations.times = 0;
      _RoleCreations.roles = [];
    }, 8e3);
  }
};
let RoleCreations = _RoleCreations;
RoleCreations.times = 0;
RoleCreations.roles = [];
export {
  RoleCreations as default
};
//# sourceMappingURL=rolecreations.js.map
