import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _RoleDeletions = class {
  constructor() {
    this.name = Events.GuildRoleDelete;
  }
  async run(role) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: role.guild.id },
      select: { antiRaid: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    _RoleDeletions.times++;
    if (_RoleDeletions.times >= 5) {
      const auditLogFetch = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
      const log = auditLogFetch.entries.first();
      if (((_a = role.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await role.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      role.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(async (r) => await member.roles.remove(r, "Deleting too many roles").catch(async () => await r.setPermissions([], "Deleting too many roles").catch(() => {
      })));
      const guild2 = await prisma.guild.findUnique({
        where: { guild: member.guild.id },
        select: { logs: true }
      });
      const logs = (_d = member.guild) == null ? void 0 : _d.channels.cache.get(guild2 == null ? void 0 : guild2.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for deleting too many roles.`,
          reason: `Too many roles deleting.`
        })
      ));
    }
    setTimeout(() => {
      _RoleDeletions.times = 0;
    }, 8e3);
  }
};
let RoleDeletions = _RoleDeletions;
RoleDeletions.times = 0;
export {
  RoleDeletions as default
};
//# sourceMappingURL=roledeletions.js.map
