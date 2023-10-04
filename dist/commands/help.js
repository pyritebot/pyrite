"use strict";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from "discord.js";
import { defaultError, buttons } from "../utils.js";
import emojis from "../emojis.js";
export default class Help {
  data = new SlashCommandBuilder().setName("help").setNameLocalizations({ "es-ES": "ayuda" }).setDescription("Display the help command.").setDescriptionLocalizations({
    "es-ES": "Mostrar el comando de ayuda (en ingl\xE9s)."
  });
  async run(interaction) {
    var _a;
    const helpEmbed = new EmbedBuilder({
      title: `${emojis.list}  Help`,
      description: `
Thanks for choosing Pyrite Bot, the future of Discord server security! 

I'm gonna help you keep your server safe from any threats that try ruin your community. 

${emojis.blank}${emojis.arrow} To fully set me up it is recommended looking at the categories below.

Click on __**Select Category**__ below to get started. 
<:blank:1008721958210383902> <:arrow:1068604670764916876> If you got any doubts join us in our [Support Server](https://discord.gg/NxJzWWqhdQ) :)
`,
      color: 2829617,
      footer: {
        text: "Pyrite",
        icon_url: (_a = interaction.client.user) == null ? void 0 : _a.displayAvatarURL()
      }
    });
    const row = new ActionRowBuilder({
      components: [
        new StringSelectMenuBuilder({
          custom_id: "help_select",
          placeholder: "Select Category",
          options: [
            {
              label: "Start",
              emoji: "<:home:1068613634957266964>",
              description: "Go back to the start.",
              value: "start"
            },
            {
              label: "Moderation",
              emoji: "<:security:1071812054010298528>",
              description: "Get a list of the moderation commands.",
              value: "moderation"
            },
            {
              label: "Verification",
              emoji: "<:check:1027354811164786739>",
              description: "Get a list of the verification commands.",
              value: "verification"
            },
            {
              label: "Whitelisting",
              emoji: "<:staff:1008719693827285002>",
              description: "Get a list of the whitelist commands.",
              value: "whitelisting"
            },
            {
              label: "Anti Raid",
              emoji: "<:ban:1020333545887113246>",
              description: "Get a list of the Anti Raid commands.",
              value: "antiraid"
            },
            {
              label: "AutoMod",
              emoji: "<:muted:1010127791070658570>",
              description: "Get a list of the AutoMod commands.",
              value: "automod"
            }
          ]
        })
      ]
    });
    try {
      await interaction.reply({
        embeds: [helpEmbed],
        components: [row, buttons],
        ephemeral: true
      });
    } catch {
      await interaction.reply(defaultError);
    }
  }
}
//# sourceMappingURL=help.js.map
