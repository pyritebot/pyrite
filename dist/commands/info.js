"use strict";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from "discord.js";
import emojis from "../emojis.js";
import { errorEmbedBuilder, buttons } from "../utils.js";
export default class Info {
  data = new SlashCommandBuilder().setName("info").setNameLocalizations({ "es-ES": "info" }).setDescription("Information about a server or a user.").setDescriptionLocalizations({
    "es-ES": "Informaci\xF3n sobre un servidor o un usuario"
  }).addSubcommand(
    (subcommand) => subcommand.setName("user").setNameLocalizations({ "es-ES": "usuario" }).setDescription("Get information about a user").setDescriptionLocalizations({
      "es-ES": "Encuentra informaci\xF3n sobre un usuario"
    }).addUserOption(
      (option) => option.setName("user").setNameLocalizations({ "es-ES": "usuario" }).setDescription("You can pass a mention or an id of a user.").setDescriptionLocalizations({
        "es-ES": "Puedes pasar una menci\xF3n o un id de un usuario"
      }).setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("server").setNameLocalizations({ "es-ES": "servidor" }).setDescription("Get information about a server").setDescriptionLocalizations({
      "es-ES": "Encuentra informaci\xF3n sobre un servidor"
    })
  );
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    switch (interaction.options.getSubcommand()) {
      case "user":
        const member = interaction.options.getMember("user");
        if (!member) {
          await interaction.reply({
            embeds: [
              errorEmbedBuilder(
                "The member you specified doesn't seem to exist, if this problem persists, please contact support"
              )
            ],
            components: [buttons]
          });
          return;
        }
        const embed1 = new EmbedBuilder().setTitle(`${emojis.compass} Who is ${member.user.tag}?`).setThumbnail(member.user.displayAvatarURL()).setFields(
          {
            name: "__Name__",
            value: `${emojis.reply1}${member.user.username} [**\`${member.user.id}\`**]`
          },
          {
            name: "__Account Creation__",
            value: `${emojis.reply1}<t:${Math.floor(member.user.createdTimestamp / 1e3) + 3600}:R>`
          },
          {
            name: "__Joined Server__",
            value: `${emojis.reply1}<t:${member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1e3) : "(No information available)"}:R>`
          },
          {
            name: "__Permissions__",
            value: `${emojis.reply1}${Object.keys(PermissionFlagsBits).map(
              (perm) => member.permissions.has(perm) ? `\`${perm}\`` : ""
            ).filter((p) => p !== "").join(", ")}`
          },
          {
            name: "__Bot__",
            value: `${emojis.reply1}${member.user.bot}`
          },
          {
            name: "__Roles__",
            value: `${emojis.reply1} ${[...member.roles.cache.values()].filter((r) => r.name !== "@everyone").join(", ")}`
          }
        ).setFooter({
          text: `${member.user.tag} \u2022 ${member.user.id}`,
          iconURL: member.user.displayAvatarURL()
        }).setTimestamp(/* @__PURE__ */ new Date()).setColor(2829617);
        await interaction.reply({
          embeds: [embed1],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel("Avatar").setURL(member.user.displayAvatarURL()).setStyle(ButtonStyle.Link)
            )
          ]
        });
        break;
      case "server":
        const embed2 = new EmbedBuilder().setTitle(`${emojis.compass} ${(_a = interaction.guild) == null ? void 0 : _a.name}`).setThumbnail(((_b = interaction.guild) == null ? void 0 : _b.iconURL()) ?? null).setFields(
          {
            name: "__Owner__",
            value: `${emojis.reply1}<@${(_c = interaction.guild) == null ? void 0 : _c.ownerId}>`
          },
          {
            name: "__Server Creation__",
            value: `${emojis.reply1}<t:${((_d = interaction.guild) == null ? void 0 : _d.createdTimestamp) ? Math.floor(((_e = interaction.guild) == null ? void 0 : _e.createdTimestamp) / 1e3) : "(No information available)"}:R>`
          },
          {
            name: "__Server ID__",
            value: `${emojis.reply1}\`${interaction.guildId}\``
          },
          {
            name: "__Member Count__",
            value: `${emojis.reply1}\`${(_f = interaction.guild) == null ? void 0 : _f.memberCount}\``
          },
          {
            name: "__Server Roles__",
            value: `${emojis.reply1}${[
              ...((_g = interaction.guild) == null ? void 0 : _g.roles.cache.values()) ?? []
            ].filter((r) => r.name !== "@everyone").join(", ")}`
          },
          {
            name: "__Server Description__",
            value: `${emojis.reply1}${((_h = interaction.guild) == null ? void 0 : _h.description) ?? "(No description provided)"}`
          }
        ).setTimestamp(/* @__PURE__ */ new Date()).setFooter({
          text: `${(_i = interaction.guild) == null ? void 0 : _i.name} \u2022 ${interaction.guildId}`,
          iconURL: ((_j = interaction.guild) == null ? void 0 : _j.iconURL()) ?? void 0
        }).setColor(2829617);
        await interaction.reply({ embeds: [embed2] });
        break;
    }
  }
}
//# sourceMappingURL=info.js.map
