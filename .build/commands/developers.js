import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { join } from "node:path";
import { buttons } from "../utils.js";
export default class Developers {
  constructor() {
    this.data = new SlashCommandBuilder().setName("devs").setDescription("The official bot developers");
  }
  async run(interaction) {
    await interaction.reply({
      files: [
        new AttachmentBuilder(join(process.cwd(), "./assets/angelnext.png"), { name: "angelnext.png" }),
        new AttachmentBuilder(join(process.cwd(), "./assets/eldi.png"), { name: "eldi.png" })
      ],
      components: [buttons]
    });
  }
}
//# sourceMappingURL=developers.js.map
