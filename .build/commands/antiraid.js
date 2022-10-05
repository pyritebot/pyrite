import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiRaid {
  constructor() {
    this.data = new SlashCommandBuilder().setName("antiraid").setDescription("Turn on the anti raid feature").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand((subcommand) => subcommand.setName("on").setDescription("Turn on anti raid!")).addSubcommand((subcommand) => subcommand.setName("off").setDescription("Turn off anti raid!"));
  }
  async run(interaction) {
    var _a, _b;
    try {
      if (!interaction.inGuild()) {
        await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      switch (interaction.options.getSubcommand()) {
        case "on":
          const onGuild = await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { antiRaid: true },
            create: { guild: interaction.guildId, antiRaid: true }
          });
          await interaction.editReply({
            embeds: [successEmbedBuilder(`anti raid has been activated successfully!`)]
          });
          const onLogs = (_a = interaction.guild) == null ? void 0 : _a.channels.cache.get(onGuild == null ? void 0 : onGuild.logs);
          await (onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Anti Raid has been activated by ${interaction.user}!`,
              reason: `anti raid features have been activated by ${interaction.user.tag}`
            })
          ));
          break;
        case "off":
          const offGuild = await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { antiRaid: false },
            create: { guild: interaction.guildId, antiRaid: false }
          });
          const offLogs = (_b = interaction.guild) == null ? void 0 : _b.channels.cache.get(offGuild == null ? void 0 : offGuild.logs);
          await (offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Anti Raid has been deactivated by ${interaction.user}!`,
              reason: `anti raid features have been deactivated by ${interaction.user.tag}`
            })
          ));
          await interaction.editReply({
            embeds: [successEmbedBuilder(`anti raid has been deactivated successfully!`)]
          });
          break;
      }
    } catch {
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=antiraid.js.map
