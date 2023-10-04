"use strict";
import { Events, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import prisma from "../database.js";
export default class AntiAlts {
  name = Events.GuildMemberAdd;
  async run(member) {
    var _a, _b, _c, _d, _e, _f;
    const guild = await prisma.guild.findUnique({
      where: { guild: (_a = member.guild) == null ? void 0 : _a.id },
      select: { logs: true, antiAlts: true }
    });
    if (!(guild == null ? void 0 : guild.antiAlts))
      return;
    const logs = (_b = member.guild) == null ? void 0 : _b.channels.cache.get(
      (guild == null ? void 0 : guild.logs) ?? ""
    );
    const accAge = Math.abs(Date.now() - member.user.createdTimestamp);
    const accDays = Math.ceil(accAge / (1e3 * 60 * 60 * 24));
    if (accDays <= 7) {
      const user = member.user;
      if (!((_f = (_e = (_d = (_c = member.guild) == null ? void 0 : _c.members) == null ? void 0 : _d.me) == null ? void 0 : _e.permissions) == null ? void 0 : _f.has(
        PermissionFlagsBits.KickMembers
      ))) {
        const errorEmbed = new EmbedBuilder({
          title: "Alt Account Detected!",
          description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
	        <:arrow:1068604670764916876> They were not kicked by the **Anti Alts system** because I don't have permission to kick members
	        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
            Date.now() / 1e3
          )}:R>`,
          thumbnail: {
            url: user.displayAvatarURL()
          },
          color: 2829617
        });
        await logs.send({ embeds: [errorEmbed] });
        return;
      }
      if (!member)
        return;
      try {
        await member.kick("Alt account");
      } catch {
        const errorEmbed = new EmbedBuilder({
          title: "Alt Account Detected!",
          description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
	        <:arrow:1068604670764916876> They were not kicked by the **Anti Alts system** because they had higher permitions that myself
	        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
            Date.now() / 1e3
          )}:R>`,
          thumbnail: {
            url: user.displayAvatarURL()
          },
          color: 2829617
        });
        await logs.send({ embeds: [errorEmbed] });
        return;
      }
      const embed = new EmbedBuilder({
        title: "Alt Account Detected!",
        description: `<:arrow:1068604670764916876> ${user} was detected as a alternative account.
        <:arrow:1068604670764916876> They were kicked by the **Anti Alts system**
        <:arrow:1068604670764916876> This happened at: <t:${Math.floor(
          Date.now() / 1e3
        )}:R>`,
        thumbnail: {
          url: user.displayAvatarURL()
        },
        color: 2829617
      });
      await (logs == null ? void 0 : logs.send({ embeds: [embed] }));
    }
  }
}
//# sourceMappingURL=antiAlts.js.map
