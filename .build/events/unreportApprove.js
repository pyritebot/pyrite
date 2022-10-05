import { Events } from "discord.js";
import prisma from "../database.js";
export default class UnReportApprove {
  constructor() {
    this.name = Events.InteractionCreate;
  }
  async run(interaction) {
    var _a, _b;
    if (!((_a = interaction.customId) == null ? void 0 : _a.startsWith("unreport_approve")))
      return;
    const data = interaction.customId.slice(15);
    console.log(data);
    const [_, id, user] = data.split("-");
    const oldUser = await prisma.user.findUnique({
      where: { user },
      select: { reports: true }
    });
    const reports = (_b = oldUser == null ? void 0 : oldUser.reports) == null ? void 0 : _b.filter((r) => r.id !== id);
    await prisma.user.update({
      where: { user },
      data: { reports }
    });
    await interaction.message.delete();
  }
}
//# sourceMappingURL=unreportApprove.js.map
