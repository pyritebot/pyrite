import { Events, AuditLogEvent, PermissionFlagsBits } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";
const _BanAdd = class {
  constructor() {
    this.name = Events.GuildBanAdd;
  }
  async run(ban) {
    var _a, _b, _c, _d;
    _BanAdd.users.push(ban.user.id);
    _BanAdd.times++;
    if (_BanAdd.times >= 5) {
      const auditLogFetch = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
      const log = auditLogFetch.entries.first();
      if (((_a = ban.client.user) == null ? void 0 : _a.id) === ((_b = log == null ? void 0 : log.executor) == null ? void 0 : _b.id))
        return;
      const member = await ban.guild.members.fetch((_c = log == null ? void 0 : log.executor) == null ? void 0 : _c.id);
      ban.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator)).forEach(async (r) => await member.roles.remove(r, "Banning too many users").catch(async () => await r.setPermissions([], "Banning too many users").catch(() => {
      })));
      _BanAdd.users.forEach(async (u) => await ban.guild.bans.remove(u).catch(() => {
      }));
      const guild = await prisma.guild.findUnique({
        where: { guild: ban.guild.id },
        select: { logs: true }
      });
      const logs = (_d = ban.guild) == null ? void 0 : _d.channels.cache.get(guild == null ? void 0 : guild.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member,
          content: `${member.user} has been demoted for banning too many users.`,
          reason: `Too many users banned`
        })
      ));
    }
    setTimeout(() => {
      _BanAdd.times = 0;
      _BanAdd.users = [];
    }, 8e3);
  }
};
let BanAdd = _BanAdd;
BanAdd.times = 0;
BanAdd.users = [];
export {
  BanAdd as default
};
//# sourceMappingURL=banadd.js.map
