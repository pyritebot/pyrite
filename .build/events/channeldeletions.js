import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _ChannelDeletions = class {
  constructor() {
    this.name = Events.ChannelDelete;
  }
  async run(channel) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: channel.guild.id },
      select: { antiRaid: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    if (!channel.guild)
      return;
    _ChannelDeletions.times++;
    if (_ChannelDeletions.times >= 5) {
      const auditLogFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
      const log = auditLogFetch.entries.first();
      if (((_a = channel.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await channel.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      channel.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(async (r) => await member.roles.remove(r, "Deleting too many channels").catch(async () => await r.setPermissions([], "Deleting too many channels").catch(() => {
      })));
      const guild2 = await prisma.guild.findUnique({
        where: { guild: channel.guild.id },
        select: { logs: true }
      });
      const logs = (_d = channel.guild) == null ? void 0 : _d.channels.cache.get(guild2 == null ? void 0 : guild2.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for deleting too many channels.`,
          reason: `Too many channels deleted.`
        })
      ));
    }
    setTimeout(() => {
      _ChannelDeletions.times = 0;
    }, 8e3);
  }
};
let ChannelDeletions = _ChannelDeletions;
ChannelDeletions.times = 0;
export {
  ChannelDeletions as default
};
//# sourceMappingURL=channeldeletions.js.map
