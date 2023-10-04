"use strict";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Clear {
  data = new SlashCommandBuilder().setName("clear").setNameLocalizations({ "es-ES": "eliminar" }).setDescription("Deletes a channel/role with the specified name").setDescriptionLocalizations({
    "es-ES": "Elmina un canal/rol con el nombre especificado"
  }).setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(
    (option) => option.setName("option").setNameLocalizations({ "es-ES": "opci\xF3n" }).setDescription("Select role, channel, or messages").setDescriptionLocalizations({
      "es-ES": "Selecciona rol, canal, o mensajes"
    }).setChoices(
      {
        name: "role",
        value: "role",
        name_localizations: { "es-ES": "rol" }
      },
      {
        name: "channel",
        value: "channel",
        name_localizations: { "es-ES": "canal" }
      },
      {
        name: "messages",
        value: "messages",
        name_localizations: { "es-ES": "mensajes" }
      }
    ).setRequired(true)
  ).addStringOption(
    (option) => option.setName("name").setNameLocalizations({ "es-ES": "nombre" }).setDescription(
      "Pass the name of the channels/roles you want to delete (only for channels/roles)"
    ).setDescriptionLocalizations({
      "es-ES": "Pasa el nombre de los canales/roles que quieres borrar (solo para canales o roles)"
    })
  ).addIntegerOption(
    (amount) => amount.setName("amount").setNameLocalizations({ "es-ES": "cantidad" }).setDescription(
      "You can pass an integer up to 100 (only for messages)."
    ).setDescriptionLocalizations({
      "es-ES": "Puedes pasar un n\xFAmero entero hasta 100 (solo para mensajes)."
    })
  );
  async run(interaction) {
    var _a, _b, _c;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    const option = interaction.options.getString("option", true);
    const name = interaction.options.getString("name");
    const amount = interaction.options.getInteger("amount");
    const guild = await prisma.guild.findUnique({
      where: {
        guild: interaction.guildId
      },
      select: {
        logs: true
      }
    });
    await interaction.deferReply({ ephemeral: true });
    switch (option) {
      case "role":
        if (!name) {
          await interaction.editReply({
            embeds: [errorEmbedBuilder("No channel names provided!")]
          }).catch(() => {
          });
          return;
        }
        (_a = interaction.guild) == null ? void 0 : _a.roles.cache.filter((r) => r.name === name).forEach(
          async (r) => await r.delete(`Requested by ${interaction.user}!`).catch(() => {
          })
        );
        break;
      case "channel":
        if (!name) {
          await interaction.editReply({
            embeds: [errorEmbedBuilder("No channel names provided!")]
          }).catch(() => {
          });
          return;
        }
        (_b = interaction.guild) == null ? void 0 : _b.channels.cache.filter((c) => c.name === name).forEach(
          async (c) => await c.delete(`Requested by ${interaction.user}!`).catch(() => {
          })
        );
        break;
      case "messages":
        if ((amount ?? 0) > 100) {
          await interaction.editReply({
            embeds: [
              errorEmbedBuilder("The amount should be equal or less than 100")
            ]
          });
          return;
        }
        try {
          [...(await ((_c = interaction.channel) == null ? void 0 : _c.messages.fetch())).values()].slice(0, amount).forEach(
            async (m) => {
              await m.delete().catch(() => {
              });
            }
          );
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                `Successfully deleted **${amount ?? 0}** messages`
              )
            ]
          });
        } catch {
          await interaction.editReply({
            embeds: [
              errorEmbedBuilder("Can't delete messages older than 14 days")
            ]
          });
          return;
        }
    }
    if (option !== "messages") {
      await interaction.editReply({
        embeds: [
          successEmbedBuilder(`Deleted all ${option}s with name **${name}**`)
        ]
      }).catch(() => {
      });
    }
  }
}
//# sourceMappingURL=clear.js.map