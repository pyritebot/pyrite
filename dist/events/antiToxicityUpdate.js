"use strict";
import { Events, EmbedBuilder } from "discord.js";
import prisma from "../database.js";
import { analyzeText } from "../utils.js";
export default class AntiToxicity {
  name = Events.MessageUpdate;
  async run(_, message) {
    var _a, _b, _c;
    if (!message.inGuild())
      return;
    if (message.author.id === ((_a = message.client.user) == null ? void 0 : _a.id))
      return;
    if (message.author.bot)
      return;
    try {
      const guild = await prisma.guild.findUnique({
        where: { guild: message.guildId },
        select: { logs: true, toxicityFilter: true }
      });
      const level = await analyzeText(message.content);
      const danger = Math.ceil(level);
      const user = await prisma.user.findUnique({
        where: { user: message.author.id },
        select: { toxicity: true }
      });
      if (danger < 20) {
        await prisma.user.upsert({
          where: { user: message.author.id },
          update: { toxicity: { decrement: 0.2 } },
          create: { user: message.author.id }
        });
        if (((user == null ? void 0 : user.toxicity) ?? 0) - 0.2 <= 0) {
          await prisma.user.upsert({
            where: { user: message.author.id },
            update: { toxicity: 0 },
            create: { user: message.author.id }
          });
        }
      } else if (danger > 80) {
        if (!(guild == null ? void 0 : guild.toxicityFilter))
          return;
        await prisma.user.upsert({
          where: { user: message.author.id },
          update: { toxicity: { increment: 2.5 } },
          create: { user: message.author.id, toxicity: 2.5 }
        });
        if (((user == null ? void 0 : user.toxicity) ?? 0) + 2.5 >= 100) {
          await prisma.user.upsert({
            where: { user: message.author.id },
            update: { toxicity: 2.5 },
            create: { user: message.author.id, toxicity: 2.5 }
          });
        }
      }
      if (!(guild == null ? void 0 : guild.toxicityFilter))
        return;
      if (danger < 90)
        return;
      await message.delete();
      const embed = new EmbedBuilder({
        author: {
          name: message.author.tag,
          icon_url: message.author.displayAvatarURL()
        },
        title: "Toxic message detected!",
        description: `
A user was detected being toxic in a channel, here are the details below:
    
    <:arrow:1068604670764916876> **Message:** ||${message.content}||  
    <:arrow:1068604670764916876> **Channel:** ${message.channel} 
<:arrow:1068604670764916876> **Reason:** toxicity`,
        color: 2829617,
        footer: {
          text: ((_b = message.guild) == null ? void 0 : _b.name) ?? "",
          icon_url: ((_c = message.guild) == null ? void 0 : _c.iconURL()) ?? ""
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const logs = message.guild.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send({ embeds: [embed] }));
    } catch {
      return;
    }
  }
}
//# sourceMappingURL=antiToxicityUpdate.js.map
