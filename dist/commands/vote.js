"use strict";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from "discord.js";
import emojis from "../emojis.js";
export default class Help {
  data = new SlashCommandBuilder().setName("vote").setNameLocalizations({ "es-ES": "votar" }).setDescription("Vote our bot to help us!").setDescriptionLocalizations({
    "es-ES": "Vota a nuestro bot para ayudarnos!"
  });
  async run(interaction) {
    const embed = new EmbedBuilder().setTitle(`${emojis.check} Vote Us!`).setDescription(
      `${emojis.arrow} By voting us, you help us grow and protect more servers! Please take 1 minute of your time to help us get to more servers.`
    ).setColor(2829617);
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Top.gg").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1008400801628164096"),
      new ButtonBuilder().setLabel("Discord Bot List").setStyle(ButtonStyle.Link).setURL("https://discord.ly/pyrite")
    );
    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: true
    });
  }
}
//# sourceMappingURL=vote.js.map
