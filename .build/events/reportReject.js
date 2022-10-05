import { Events } from "discord.js";
export default class ReportApprove {
  constructor() {
    this.name = Events.InteractionCreate;
  }
  async run(interaction) {
    var _a;
    if (!((_a = interaction.customId) == null ? void 0 : _a.startsWith("report_reject")))
      return;
    await interaction.message.delete();
  }
}
//# sourceMappingURL=reportReject.js.map
