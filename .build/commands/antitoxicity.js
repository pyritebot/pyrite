import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { defaultError, successEmbedBuilder, errorEmbedBuilder, logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class AntiToxicity {
  constructor() {
    this.data = new SlashCommandBuilder().setName("antitoxicity").setDescription("Add a toxicity filter to your server to keep a PG-13 environment.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand((subcommand) => subcommand.setName("on").setDescription("Turn toxicity filter on!")).addSubcommand((subcommand) => subcommand.setName("off").setDescription("Turn toxicity filter off!"));
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
            select: { logs: true },
            update: { toxicityFilter: true },
            create: {
              guild: interaction.guildId,
              toxicityFilter: true
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`toxicity filter has been activated successfully!`)] });
          const onLogs = (_a = interaction.guild) == null ? void 0 : _a.channels.cache.get(onGuild == null ? void 0 : onGuild.logs);
          await (onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Anti Toxicity has been activated by ${interaction.user}!`,
              reason: `anti toxicity feature has been activated by ${interaction.user.tag}`
            })
          ));
          break;
        case "off":
          const offGuild = await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            select: { logs: true },
            update: { toxicityFilter: false },
            create: {
              guild: interaction.guildId,
              toxicityFilter: false
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`toxicity filter has been deactivated successfully!`)] });
          const offLogs = (_b = interaction.guild) == null ? void 0 : _b.channels.cache.get(offGuild == null ? void 0 : offGuild.logs);
          await (offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Anti Toxicity has been deactivated by ${interaction.user}!`,
              reason: `anti toxicity feature has been deactivated by ${interaction.user.tag}`
            })
          ));
          break;
      }
    } catch {
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=antitoxicity.js.map
