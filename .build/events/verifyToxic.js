import { Events } from "discord.js";
import { errorEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class RoleDeletions {
  constructor() {
    this.name = Events.InteractionCreate;
  }
  async run(interaction) {
    var _a, _b, _c;
    if (!interaction.isButton())
      return;
    if (!interaction.customId.startsWith("verify_toxic"))
      return;
    const memberId = interaction.customId.slice(13);
    try {
      const member = await ((_a = interaction.guild) == null ? void 0 : _a.members.fetch(memberId));
      const guild = await prisma.guild.findUnique({
        where: { guild: interaction.guildId },
        select: { members: true }
      });
      const role = (_b = interaction.guild) == null ? void 0 : _b.roles.cache.get(guild == null ? void 0 : guild.members);
      await ((_c = member == null ? void 0 : member.roles) == null ? void 0 : _c.add(role));
      await interaction.message.delete();
    } catch {
      await interaction.reply({ embeds: [errorEmbedBuilder("The member is not in this server")], ephemeral: true });
    }
  }
}
//# sourceMappingURL=verifyToxic.js.map
