import { SlashCommandBuilder } from "discord.js";
import { addReport, errorEmbedBuilder } from "../utils.js";
export default class Report {
  constructor() {
    this.data = new SlashCommandBuilder().setName("report").setDescription("Report to spread awareness of potentially toxic users and scammers").addUserOption((option) => option.setName("user").setDescription("The user you want to report").setRequired(true)).addStringOption((option) => option.setName("reason").setDescription("Why do you want to report this user?").setRequired(true)).addAttachmentOption((option) => option.setName("image").setDescription("To approve this report, we need image proof.").setRequired(true));
  }
  async run(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    await addReport(interaction);
  }
}
//# sourceMappingURL=report.js.map
