"use strict";
import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import emojis from "../emojis.js";
import { buttons } from "../utils.js";
export default class Developers {
  data = new SlashCommandBuilder().setName("devs").setNameLocalizations({ "es-ES": "desarrolladores" }).setDescription("The official bot developers.").setDescriptionLocalizations({
    "es-ES": "Los desarrolladores oficiales del bot."
  });
  async run(interaction) {
    const user1 = await interaction.client.users.fetch("807705107852558386");
    const user2 = await interaction.client.users.fetch("713745288619360306");
    const embed1 = new EmbedBuilder().setTitle(`${emojis.pyrite} ${user1 == null ? void 0 : user1.tag}`).setThumbnail(user1 == null ? void 0 : user1.displayAvatarURL()).setFields(
      {
        name: "ID",
        value: `${emojis.reply1} \`807705107852558386\` `
      },
      {
        name: "Role",
        value: `${emojis.reply1} Lead Developer`
      },
      {
        name: "Joined Discord",
        value: `${emojis.reply1} <t:${Math.floor((user1 == null ? void 0 : user1.createdTimestamp) / 1e3) + 3600}:F>`
      },
      {
        name: "Github",
        value: `${emojis.reply1} **__https://github.com/AngelNext__**`
      }
    ).setFooter({
      text: user1.tag,
      iconURL: user1 == null ? void 0 : user1.displayAvatarURL()
    }).setColor(2829617);
    const embed2 = new EmbedBuilder().setTitle(`${emojis.pyrite} ${user2 == null ? void 0 : user2.tag}`).setThumbnail(user2 == null ? void 0 : user2.displayAvatarURL()).setFields(
      {
        name: "ID",
        value: `${emojis.reply1} \`713745288619360306\` `
      },
      {
        name: "Role",
        value: `${emojis.reply1} Developer, Designer`
      },
      {
        name: "Joined Discord",
        value: `${emojis.reply1} <t:${Math.floor((user2 == null ? void 0 : user2.createdTimestamp) / 1e3) + 3600}:F>`
      },
      {
        name: "Github",
        value: `${emojis.reply1} **__https://github.com/eldimindcrafter123__**`
      }
    ).setFooter({
      text: user2.tag,
      iconURL: user2 == null ? void 0 : user2.displayAvatarURL()
    }).setColor(2829617);
    await interaction.reply({
      embeds: [embed1, embed2],
      components: [buttons]
    });
  }
}
//# sourceMappingURL=devs.js.map
