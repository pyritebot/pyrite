import { Events } from "discord.js";
import prisma from "../database.js";
export default class ReportApprove {
  constructor() {
    this.name = Events.InteractionCreate;
  }
  async run(interaction) {
    var _a;
    if (!((_a = interaction.customId) == null ? void 0 : _a.startsWith("report_approve")))
      return;
    const data = interaction.customId.slice(15);
    const [reason, user] = data.split("-");
    await prisma.user.upsert({
      where: { user },
      update: { reports: { push: { reason } } },
      create: { user, reports: [{ reason }] }
    });
    await interaction.message.delete();
  }
}
//# sourceMappingURL=reportApprove.js.map
