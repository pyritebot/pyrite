"use strict";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";
import {
  defaultError,
  errorEmbedBuilder,
  logBuilder,
  successEmbedBuilder,
  getQuarantine
} from "../utils.js";
import prisma from "../database.js";
export default class Verification {
  data = new SlashCommandBuilder().setName("verification").setNameLocalizations({ "es-ES": "verificaci\xF3n" }).setDescription("Configure verification in your server!").setDescriptionLocalizations({
    "es-ES": "\xA1Configura la verificaci\xF3n en tu servidor!"
  }).setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand(
    (subcommand) => subcommand.setName("on").setNameLocalizations({ "es-ES": "en" }).setDescription(
      "Turn on verification and post embed in the specified channel!"
    ).setDescriptionLocalizations({
      "es-ES": '\xA1Enciende la verificaci\xF3n y publica el "embed" en el canal especificado!'
    }).addChannelOption(
      (option) => option.setName("channel").setNameLocalizations({ "es-ES": "canal" }).setDescription("The verification channel").setDescriptionLocalizations({
        "es-ES": "El canal de verificaci\xF3n"
      }).setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("off").setNameLocalizations({ "es-ES": "apagada" }).setDescription("Turn off verification.").setDescriptionLocalizations({ "es-ES": "Apagar la verificaci\xF3n" })
  ).addSubcommand(
    (subcommand) => subcommand.setName("role").setNameLocalizations({ "es-ES": "rol" }).setDescription("Set the role to be assigned once verified").setDescriptionLocalizations({
      "es-ES": "Configura el rol que debe ser asignado una vez verificado!"
    }).addRoleOption(
      (option) => option.setName("role").setNameLocalizations({ "es-ES": "rol" }).setDescription("role to be assigned once verified").setDescriptionLocalizations({
        "es-ES": "rol que debe ser asignado una vez verificado"
      }).setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("removerole").setNameLocalizations({ "es-ES": "eliminar-rol" }).setDescription("Remove the role to be assigned once verified").setDescriptionLocalizations({
      "es-ES": "Eliminar el role que debe ser asignado una vez verificado"
    })
  );
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!interaction.inGuild()) {
      await interaction.reply({
        embeds: [
          errorEmbedBuilder("This command can only be run on a server!")
        ]
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      switch (interaction.options.getSubcommand()) {
        case "on":
          const channel = interaction.options.getChannel(
            "channel"
          );
          if ((channel == null ? void 0 : channel.type) !== ChannelType.GuildText) {
            await interaction.editReply({
              embeds: [
                errorEmbedBuilder("The channel must be a Text Channel.")
              ]
            });
            return;
          }
          const quarantine = await getQuarantine(interaction.guild);
          (_a = interaction.guild) == null ? void 0 : _a.channels.cache.forEach(async (ch) => {
            var _a2;
            const c = ch;
            await ((_a2 = c.permissionOverwrites) == null ? void 0 : _a2.edit(quarantine, {
              ViewChannel: false
            }));
          });
          channel.permissionOverwrites.edit(quarantine, {
            ViewChannel: true,
            SendMessages: false
          });
          channel.permissionOverwrites.edit(interaction.guildId, {
            ViewChannel: false
          });
          const verificationButtons = new ActionRowBuilder({
            components: [
              new ButtonBuilder({
                label: "Verify",
                style: ButtonStyle.Success,
                custom_id: "verify"
              }),
              new ButtonBuilder({
                label: "Help",
                style: ButtonStyle.Link,
                url: "https://discord.gg/NxJzWWqhdQ"
              })
            ]
          });
          const verificationEmbed = new EmbedBuilder({
            title: "<:check:1027354811164786739> Verification",
            description: `<:blank:1008721958210383902> <:arrow:1068604670764916876> To access \`${(_b = interaction.guild) == null ? void 0 : _b.name}\` you must complete the verification process. 
<:blank:1008721958210383902><:blank:1008721958210383902><:reply:1067159718646263910> Press on the **Verify** button below.`,
            color: 2829617
          });
          await channel.send({
            embeds: [verificationEmbed],
            components: [verificationButtons]
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder("Successfully activated verification!")
            ]
          });
          const guild = await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { verificationChannel: channel.id },
            create: {
              guild: interaction.guildId,
              verificationChannel: channel.id
            },
            select: { logs: true }
          });
          const onLogs = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(
            (guild == null ? void 0 : guild.logs) ?? ""
          );
          onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              reason: `Verification turned on by ${interaction.user.tag}`
            })
          );
          break;
        case "off":
          const tempGuild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { verificationChannel: true, logs: true }
          });
          const tempChannel = (_f = (_e = (_d = interaction.guild) == null ? void 0 : _d.channels) == null ? void 0 : _e.cache) == null ? void 0 : _f.get(
            (tempGuild == null ? void 0 : tempGuild.verificationChannel) ?? ""
          );
          await (tempChannel == null ? void 0 : tempChannel.delete());
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { verificationChannel: null },
            create: { guild: interaction.guildId }
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                "Successfully deactivated verification in this server!"
              )
            ]
          });
          const offLogs = (_g = interaction.guild) == null ? void 0 : _g.channels.cache.get(
            (tempGuild == null ? void 0 : tempGuild.logs) ?? ""
          );
          offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              reason: `Verification turned off by ${interaction.user.tag}`
            })
          );
          break;
        case "role":
          const role = interaction.options.getRole("role");
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { members: role == null ? void 0 : role.id },
            create: {
              guild: interaction.guildId,
              members: role == null ? void 0 : role.id
            }
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder(
                `Successfully set the **Member** role as ${role}`
              )
            ]
          });
          break;
        case "removerole":
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { members: null },
            create: {
              guild: interaction.guildId,
              members: null
            }
          });
          await interaction.editReply({
            embeds: [
              successEmbedBuilder("Successfully removed the **Member** role")
            ]
          });
          break;
      }
    } catch (err) {
      await interaction.editReply(defaultError);
      console.error(err);
    }
  }
}
//# sourceMappingURL=verification.js.map
