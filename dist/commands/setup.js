"use strict";
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { errorEmbedBuilder, optionButtons } from "../utils.js";
export default class Setup {
  data = new SlashCommandBuilder().setName("setup").setDescription("Setup the Bot in this server!").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  async run(interaction) {
    var _a;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    const channel = await ((_a = interaction.guild) == null ? void 0 : _a.channels.create({
      name: "setup-channel",
      permissionOverwrites: [
        {
          id: interaction.guildId,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel]
        }
      ]
    }));
    await interaction.reply({ content: `Go to ${channel} to continue setting up the server!`, ephemeral: true });
    await (channel == null ? void 0 : channel.send({ content: `${interaction.user}, I will walk you through the steps to set up ${interaction.client.user} in this server!` }));
    const embed = new EmbedBuilder({
      title: ":no_entry_sign: Anti Spam",
      description: "<:reply:1067159718646263910> Would you like to use our effective spam system to stop members from spamming in your server?",
      color: 2829617
    });
    await (channel == null ? void 0 : channel.send({ embeds: [embed], components: [optionButtons("antispam")] }));
  }
}
//# sourceMappingURL=setup.js.map
