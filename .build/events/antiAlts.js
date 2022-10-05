import { Events, EmbedBuilder, Colors } from "discord.js";
import prisma from "../database.js";
export default class AntiAlts {
  constructor() {
    this.name = Events.GuildMemberAdd;
  }
  async run(member) {
    var _a, _b;
    const guild = await prisma.guild.findUnique({
      where: { guild: (_a = member.guild) == null ? void 0 : _a.id },
      select: { logs: true, antiAlts: true }
    });
    if (!(guild == null ? void 0 : guild.antiAlts))
      return;
    const accAge = Math.abs(Date.now() - member.user.createdTimestamp);
    const accDays = Math.ceil(accAge / (1e3 * 60 * 60 * 24));
    if (accDays <= 7) {
      const user = member.user;
      await member.kick("This account was detected as a alternative account");
      const logs = (_b = member.guild) == null ? void 0 : _b.channels.cache.get(guild == null ? void 0 : guild.logs);
      const embed = new EmbedBuilder({
        title: "Alt Account Detected!",
        description: `<:arrow:1009057573590290452> ${user} was detected as a alternative account.
        <:blank:1008721958210383902> They were kicked by the **Anti Alts system**
        <:blank:1008721958210383902> This happened at: <t:${Math.floor(Date.now() / 1e3)}:R>`,
        thumbnail: {
          url: user.displayAvatarURL()
        },
        color: Colors.Blurple
      });
      await (logs == null ? void 0 : logs.send({ embeds: [embed] }));
    }
  }
}
//# sourceMappingURL=antiAlts.js.map
