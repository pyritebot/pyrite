import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _Kick = class {
  constructor() {
    this.name = Events.GuildMemberRemove;
  }
  async run(member) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: member.guild.id },
      select: { antiRaid: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    _Kick.times++;
    if (_Kick.times >= 5) {
      const auditLogFetch = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
      const log = auditLogFetch.entries.first();
      if (!log)
        return;
      if (log.createdAt < member.joinedAt)
        return;
      if (((_a = member.client.user) == null ? void 0 : _a.id) === ((_b = log.executor) == null ? void 0 : _b.id))
        return;
      const executor = await member.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      executor.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(
        async (r) => await executor.roles.remove(r, "Kicking too many users").catch(async () => await r.setPermissions([], "Kicking too many users").catch(() => {
        }))
      );
      const guild2 = await prisma.guild.findUnique({
        where: { guild: member.guild.id },
        select: { logs: true }
      });
      const logs = (_d = member.guild) == null ? void 0 : _d.channels.cache.get(guild2 == null ? void 0 : guild2.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for kicking too many users.`,
          reason: `Too many users kicked.`
        })
      ));
    }
    setTimeout(() => {
      _Kick.times = 0;
    }, 8e3);
  }
};
let Kick = _Kick;
Kick.times = 0;
export {
  Kick as default
};
//# sourceMappingURL=kick.js.map
