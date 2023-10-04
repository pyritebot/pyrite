"use strict";
import { Events, AuditLogEvent } from "discord.js";
import { logBuilder, getQuarantine } from "../utils.js";
import prisma from "../database.js";
export default class BanAdd {
  name = Events.GuildBanAdd;
  static times = 0;
  static users = [];
  static timeout = setTimeout(() => {
    BanAdd.times = 0;
    BanAdd.users = [];
  }, 2e4);
  async run(ban) {
    var _a, _b, _c, _d;
    const guild = await prisma.guild.findUnique({
      where: { guild: ban.guild.id },
      select: {
        antiRaid: true,
        logs: true,
        owners: true,
        admins: true
      }
    });
    BanAdd.users.push(ban.user.id);
    BanAdd.times++;
    BanAdd.timeout.refresh();
    if (BanAdd.times % 5 === 0) {
      const auditLogFetch = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd
      });
      const log = auditLogFetch.entries.first();
      if (((_a = ban.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await ban.guild.members.fetch(((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id) ?? "");
      if ((guild == null ? void 0 : guild.admins.includes(member.user.id)) || (guild == null ? void 0 : guild.owners.includes(member.user.id)) || member.user.id === member.guild.ownerId)
        return;
      const quarantine = await getQuarantine(ban.guild);
      member.roles.cache.filter((r) => r.id !== ban.guild.id).forEach(async (r) => {
        await member.roles.remove(r, "Banning too many users").catch(async () => {
          if (!member.user.bot)
            return;
          r == null ? void 0 : r.setPermissions([]).catch(() => {
          });
        });
      });
      await member.roles.add(quarantine, "Banning too many users");
      await member.timeout(1440 * 6e4, "Banning too many users").catch(() => {
      });
      BanAdd.users.forEach(async (user) => {
        await ban.guild.members.unban(user).catch(() => {
        });
      });
      const logs = (_d = ban.guild) == null ? void 0 : _d.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          reason: "Too many users banned",
          punished: true
        })
      ));
    }
  }
}
//# sourceMappingURL=banAdd.js.map
