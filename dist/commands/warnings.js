"use strict";
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import {
  addWarn,
  defaultError,
  errorEmbedBuilder,
  logBuilder,
  successEmbedBuilder
} from "../utils.js";
import {
  ButtonStyles,
  ButtonTypes,
  pagination
} from "@devraelfreeze/discordjs-pagination";
import emojis from "../emojis.js";
import prisma from "../database.js";
export default class Warnings {
  data = new SlashCommandBuilder().setName("warnings").setDescription("Use this command to manage the warnings in your server!").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addSubcommand(
    (subcommand) => subcommand.setName("add").setNameLocalizations({ "es-ES": "advertir" }).setDescription("Warn a user!").setDescriptionLocalizations({ "es-ES": "Advierte a un usuario!" }).addUserOption(
      (option) => option.setName("member").setNameLocalizations({ "es-ES": "miembro" }).setDescription("You can pass a mention or an id of a member.").setDescriptionLocalizations({
        "es-ES": "Puedes pasar una menci\xF3n o un id de un miembro."
      }).setRequired(true)
    ).addStringOption(
      (option) => option.setName("reason").setNameLocalizations({ "es-ES": "raz\xF3n" }).setDescription("You must provide a reason for this warning").setDescriptionLocalizations({
        "es-ES": "Debes proveer una raz\xF3n para esta advertencia"
      }).setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("remove").setNameLocalizations({ "es-ES": "quitar" }).setDescription("Remove a warning from a user!").setDescriptionLocalizations({
      "es-ES": "Quita una advertencia de un usuario!"
    }).addUserOption(
      (option) => option.setName("user").setDescription("You can pass a mention or an id of a member.").setRequired(true)
    ).addStringOption(
      (option) => option.setName("id").setDescription(
        "You can provide the id of the warning you want to delete!"
      )
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("show").setDescription("Show all warnings of a user!").addUserOption(
      (option) => option.setName("user").setDescription("You can pass a mention or an id of a member.").setRequired(true)
    )
  );
  async run(interaction) {
    var _a, _b, _c, _d;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    const member = interaction.options.getMember("user");
    if (!member) {
      await interaction.reply({
        embeds: [errorEmbedBuilder("Couldn't find that member!")],
        ephemeral: true
      });
      return;
    }
    switch (interaction.options.getSubcommand()) {
      case "add":
        await addWarn(interaction);
        break;
      case "remove": {
        const id = interaction.options.getString("id");
        if (member.user.bot) {
          await interaction.reply({
            embeds: [
              errorEmbedBuilder("You cannot remove a warning from a bot!")
            ],
            ephemeral: true
          });
          return;
        }
        if (member.user.id === interaction.user.id) {
          await interaction.reply({
            embeds: [
              errorEmbedBuilder("You cannot remove warnings from yourself!")
            ],
            ephemeral: true
          });
          return;
        }
        await interaction.deferReply({ ephemeral: true });
        try {
          const guild = await prisma.guild.findUnique({
            where: {
              guild: interaction.guildId
            },
            select: {
              mods: true,
              admins: true,
              owners: true,
              logs: true
            }
          });
          const roles = (_a = interaction.member) == null ? void 0 : _a.roles;
          if (!(roles.cache.has((guild == null ? void 0 : guild.mods) ?? "") || (guild == null ? void 0 : guild.admins.includes(interaction.user.id)) || (guild == null ? void 0 : guild.owners.includes(interaction.user.id)) || interaction.user.id === ((_b = interaction.guild) == null ? void 0 : _b.ownerId))) {
            await interaction.editReply({
              embeds: [
                errorEmbedBuilder(
                  "You don't have permission to remove warnings from members!"
                )
              ]
            });
            return;
          }
          const warns = await prisma.warn.findMany({
            where: {
              userId: member.user.id,
              guildId: member.guild.id
            }
          });
          if ((warns == null ? void 0 : warns.length) === 0) {
            await interaction.editReply({
              embeds: [
                errorEmbedBuilder("This user doesn't have any warnings")
              ]
            });
            break;
          }
          if (!id) {
            await prisma.warn.delete({
              where: {
                userId_guildId: {
                  userId: member.user.id,
                  guildId: member.guild.id
                }
              }
            });
            await interaction.editReply({
              embeds: [
                successEmbedBuilder(`Removed all warnings from ${member.user}`)
              ]
            });
            const logs2 = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(
              (guild == null ? void 0 : guild.logs) ?? ""
            );
            await (logs2 == null ? void 0 : logs2.send(
              logBuilder({
                member: interaction.member,
                reason: `Warns removed by ${interaction.user.tag}`
              })
            ));
            break;
          }
          try {
            await prisma.warn.delete({
              where: { id }
            });
          } catch {
            await interaction.editReply({
              embeds: [
                errorEmbedBuilder(
                  `Warning with id \`${id}\` has not been found!`
                )
              ]
            });
            break;
          }
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                `Removed warning with id \`${id}\` from ${member.user}`
              )
            ]
          });
          const logs = (_d = interaction.guild) == null ? void 0 : _d.channels.cache.get(
            (guild == null ? void 0 : guild.logs) ?? ""
          );
          await (logs == null ? void 0 : logs.send(
            logBuilder({
              member: interaction.member,
              reason: `Warn removed by ${interaction.user.tag}`
            })
          ));
        } catch {
          await interaction.editReply(defaultError);
        }
        break;
      }
      case "show":
        if (member.user.bot) {
          await interaction.reply({
            embeds: [errorEmbedBuilder("You cannot show warnings for a bot!")],
            ephemeral: true
          });
          return;
        }
        await interaction.deferReply({ ephemeral: true });
        try {
          const warns = await prisma.warn.findMany({
            where: {
              userId: member.user.id,
              guildId: interaction.guildId
            }
          });
          let min = 0;
          let max = 5;
          const show = () => {
            var _a2, _b2;
            min = min + 5;
            max = max + 5;
            return new EmbedBuilder().setTitle(`${emojis.warn} Warnings`).setDescription(
              `${emojis.reply1} Here are the current warnings for ${member.user} 
`
            ).setThumbnail(member.user.displayAvatarURL()).setImage(
              (warns == null ? void 0 : warns.length) === 0 ? "https://i.imgur.com/ozUEfs5.gif" : null
            ).setFields(
              warns == null ? void 0 : warns.filter((_, i) => i < max - 5 && i >= min - 5).map((warn, i) => {
                return {
                  name: `__Warning ${i + (min - 4)}__`,
                  value: `${emojis.arrow} **ID:** \`${warn.id}\` 
 ${emojis.arrow} **Date:** <t:${Math.floor(
                    warn.createdAt.getTime() / 1e3
                  )}:R> 
 ${emojis.arrow} **Reason:** ${warn.reason} 
`
                };
              })
            ).setColor(2829617).setFooter({
              text: ((_a2 = interaction.guild) == null ? void 0 : _a2.name) ?? "",
              iconURL: ((_b2 = interaction.guild) == null ? void 0 : _b2.iconURL()) ?? void 0
            });
          };
          await pagination({
            embeds: (warns == null ? void 0 : warns.length) !== 0 ? [...Array(Math.ceil(warns.length / 5))].map(
              () => show()
            ) : [show()],
            author: interaction.member.user,
            interaction,
            ephemeral: false,
            time: 4e4,
            disableButtons: true,
            fastSkip: false,
            pageTravel: false,
            buttons: [
              {
                type: ButtonTypes.previous,
                label: "Previous Page",
                style: ButtonStyles.Success,
                emoji: `${emojis.arrow2}`
              },
              {
                type: ButtonTypes.next,
                label: "Next Page",
                style: ButtonStyles.Success,
                emoji: `${emojis.arrow}`
              }
            ]
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply(defaultError);
        }
        break;
    }
  }
}
//# sourceMappingURL=warnings.js.map
