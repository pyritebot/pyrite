"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class ChannelCreations {
  name = Events.ChannelCreate;
  static times = 0;
  static channels = [];
  static timeout = setTimeout(() => {
    ChannelCreations.times = 0;
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
      return false;
    ChannelCreations.channels.push(channel.id);
    ChannelCreations.times++;
    ChannelCreations.timeout.refresh();
    if (ChannelCreations.times % 5 === 0) {
      const auditLogFetch = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelCreate
      });
      const log = auditLogFetch.entries.first();
      if (((_a = channel.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await channel.guild.members.fetch(((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id) ?? "");
      const quarantine = await getQuarantine(channel.guild);
      member.roles.cache.filter((r) => r.id !== channel.guild.id).forEach(async (r) => {
        await member.roles.remove(r, "Creating too many channels").catch(async () => {
          if (!member.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      await member.roles.add(quarantine, "Creating too many channels");
      await member.timeout(1440 * 6e4, "Creating too many channels").catch(() => {
      });
      ChannelCreations.channels.forEach(async (c) => {
        var _a2, _b2;
        await ((_b2 = (_a2 = channel.guild.channels.cache.get(c)) == null ? void 0 : _a2.delete()) == null ? void 0 : _b2.catch(() => {
        }));
      });
      const logs = (_d = channel.guild) == null ? void 0 : _d.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many channels created.",
          punished: true
        })
      ));
    }
  }
}
//# sourceMappingURL=channelCreate.js.map
