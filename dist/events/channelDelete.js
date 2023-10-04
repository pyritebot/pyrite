"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class ChannelDeletions {
  name = Events.ChannelDelete;
  static times = 0;
  static timeout = setTimeout(() => {
    ChannelDeletions.times = 0;
  }, 8e3);
  async run(channel) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: channel.guild.id },
      select: { antiRaid: true, logs: true }
    });
    if (!(guild == null ? void 0 : guild.antiRaid))
      return;
    if (!channel.guild)
      return;
    ChannelDeletions.times++;
    ChannelDeletions.timeout.refresh();
    if (ChannelDeletions.times % 5 === 0) {
      const auditLogFetch = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete
      });
      const log = auditLogFetch.entries.first();
      if (((_a = channel.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await channel.guild.members.fetch(((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id) ?? "");
      const quarantine = await getQuarantine(channel.guild);
      member.roles.cache.filter((r) => r.id !== channel.guild.id).forEach(async (r) => {
        await member.roles.remove(r, "Deleting to many channels").catch(async () => {
          if (!member.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      await member.roles.add(quarantine, "Deleting to many channels");
      await member.timeout(1440 * 6e4, "Deleting too many channels").catch(() => {
      });
      const logs = (_d = channel.guild) == null ? void 0 : _d.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many channels deleted.",
          punished: true
        })
      ));
    }
  }
}
//# sourceMappingURL=channelDelete.js.map
