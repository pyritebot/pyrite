import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _ChannelCreations = class {
  constructor() {
    this.name = Events.ChannelCreate;
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
      return false;
    _ChannelCreations.channels.push(channel.id);
    _ChannelCreations.times++;
    if (_ChannelCreations.times >= 5) {
      const auditLogFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
      const log = auditLogFetch.entries.first();
      if (((_a = channel.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await channel.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      channel.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(async (r) => await member.roles.remove(r, "Creating too many channels").catch(async () => await r.setPermissions([], "Creating too many channels").catch(() => {
      })));
      _ChannelCreations.channels.forEach(async (c) => {
        var _a2;
        return await ((_a2 = channel.guild.channels.cache.get(c)) == null ? void 0 : _a2.delete().catch(() => {
        }));
      });
      const guild2 = await prisma.guild.findUnique({
        where: { guild: channel.guild.id },
        select: { logs: true }
      });
      const logs = (_d = channel.guild) == null ? void 0 : _d.channels.cache.get(guild2 == null ? void 0 : guild2.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for creating too many channels.`,
          reason: `Too many channels created.`
        })
      ));
    }
    setTimeout(() => {
      _ChannelCreations.times = 0;
      _ChannelCreations.channels = [];
    }, 8e3);
  }
};
let ChannelCreations = _ChannelCreations;
ChannelCreations.times = 0;
ChannelCreations.channels = [];
export {
  ChannelCreations as default
};
//# sourceMappingURL=channelcreations.js.map
