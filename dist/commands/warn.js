"use strict";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addWarn, errorEmbedBuilder } from "../utils.js";
export default class Warn {
  data = new SlashCommandBuilder().setName("warn").setNameLocalizations({ "es-ES": "advertir" }).setDescription("Warn a user! (alias to /warnings add)").setDescriptionLocalizations({ "es-ES": "Advierte a un usuario!" }).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(
    (option) => option.setName("member").setNameLocalizations({ "es-ES": "miembro" }).setDescription("You can pass a mention or an id of a member.").setDescriptionLocalizations({ "es-ES": "Puedes pasar una menci\xF3n o un id de un miembro." }).setRequired(true)
  ).addStringOption(
    (option) => option.setName("reason").setNameLocalizations({ "es-ES": "raz\xF3n" }).setDescription("You must provide a reason for this warning").setDescriptionLocalizations({ "es-ES": "Debes proveer una raz\xF3n para esta advertencia" }).setRequired(true)
  );
  async run(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    await addWarn(interaction);
  }
}
//# sourceMappingURL=warn.js.map
