"use strict";
import { Events, Collection, ChannelType } from "discord.js";
import prisma from "../database.js";
import { logBuilder } from "../utils.js";
export default class AntiSpam {
  name = Events.MessageCreate;
  static users = new Collection();
  static timeout = (id) => setTimeout(() => {
    AntiSpam.users.delete(id);
  }, 1e4);
  async purge(message, minutes, limit) {
    var _a;
    await ((_a = message.member) == null ? void 0 : _a.timeout(6e4 * minutes, "spamming"));
    const messages = [
      ...message.channel.messages.cache.filter((m) => m.author.id === message.author.id).values()
    ].slice(0, limit);
    await message.channel.bulkDelete(messages);
  }
  async run(message) {
    var _a, _b;
    if (!message.inGuild())
      return;
    if (message.channel.type !== ChannelType.GuildText)
      return;
    const guild = await prisma.guild.findUnique({
      where: { guild: message.guildId },
      select: {
        antiSpam: true,
        admins: true,
        owners: true,
        spamMinutes: true,
        spamMessageLimit: true,
        logs: true
      }
    });
    if (!(guild == null ? void 0 : guild.antiSpam))
      return;
    if ((guild == null ? void 0 : guild.admins.includes(message.author.id)) || (guild == null ? void 0 : guild.owners.includes(message.author.id)) || message.author.id === message.guild.ownerId)
      return;
    AntiSpam.timeout(message.author.id).refresh();
    const minutes = guild == null ? void 0 : guild.spamMinutes;
    const limit = guild == null ? void 0 : guild.spamMessageLimit;
    const msgCount = (AntiSpam.users.get(message.author.id ?? message.webhookId) ?? 0) + 1;
    if (message.author.id === ((_a = message.client.user) == null ? void 0 : _a.id))
      return;
    if (!AntiSpam.users.has(message.author.id)) {
      AntiSpam.users.set(message.author.id, 1);
      return;
    }
    if (msgCount === limit) {
      await this.purge(message, minutes, limit).catch(() => {
        message.guild.roles.cache.filter((r) => r.id !== message.guildId).forEach(async (r) => {
          var _a2;
          await ((_a2 = message.member) == null ? void 0 : _a2.roles.remove(r, "Spamming").catch(async () => {
            if (!message.author.bot)
              return;
            await r.setPermissions([], "Spamming").catch(() => {
            });
            await this.purge(message, minutes, limit).catch(() => {
            });
            AntiSpam.users.set(
              message.author.id ?? message.webhookId,
              msgCount
            );
          }));
          await this.purge(message, minutes, limit).catch(() => {
          });
          AntiSpam.users.set(message.author.id, msgCount);
        });
      });
      const webhooks = await message.channel.fetchWebhooks();
      const webhook = webhooks == null ? void 0 : webhooks.find((w) => w.id === message.webhookId);
      await ((_b = webhook == null ? void 0 : webhook.delete("Spamming")) == null ? void 0 : _b.catch(() => {
      }));
      const logs = message.guild.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          reason: `Was detected spamming. Webhook: ${!!message.webhookId}!`,
          guild: message.guild,
          punished: true,
          member: message.member || `<@${message.webhookId}>`
        })
      ));
    }
    AntiSpam.users.set(message.author.id, msgCount);
  }
}
//# sourceMappingURL=antiSpam.js.map
