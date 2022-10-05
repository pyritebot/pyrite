import { Events } from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder } from "../utils.js";
export default class RoleDeletions {
  constructor() {
    this.name = Events.InteractionCreate;
  }
  async run(interaction) {
    var _a;
    if (!interaction.isButton())
      return;
    if (!interaction.customId.startsWith("ban_toxic"))
      return;
    const memberId = interaction.customId.slice(10);
    try {
      const member = await ((_a = interaction.guild) == null ? void 0 : _a.members.fetch(memberId));
      const user = member == null ? void 0 : member.user;
      await (member == null ? void 0 : member.ban({ reason: "toxicity levels higher than normal" }));
      await interaction.reply({ embeds: [successEmbedBuilder(`Successfully banned ${user}!`)], ephemeral: true });
      await interaction.message.delete();
    } catch {
      await interaction.reply({ embeds: [errorEmbedBuilder("The member is not in this server")], ephemeral: true });
    }
  }
}
//# sourceMappingURL=banToxic.js.map
