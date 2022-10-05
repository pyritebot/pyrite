import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { errorEmbedBuilder, successEmbedBuilder, logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Clear {
  constructor() {
    this.data = new SlashCommandBuilder().setName("clear").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDescription("Clear messages in a channel!").addIntegerOption((amount) => amount.setName("amount").setDescription("You can pass an integer up to 100").setRequired(true));
  }
  async run(interaction) {
    var _a, _b;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    try {
      const amount = interaction.options.getInteger("amount", true);
      if (amount > 100) {
        await interaction.reply({ embeds: [errorEmbedBuilder("The amount should be equal or less than 100")], ephemeral: true });
        return;
      }
      const { size } = await ((_a = interaction.channel) == null ? void 0 : _a.bulkDelete(amount));
      await interaction.reply({ embeds: [successEmbedBuilder(`Successfully deleted **${size}** messages`)], ephemeral: true });
      const guild = await prisma.guild.findUnique({
        where: { guild: interaction.guildId },
        select: { logs: true }
      });
      const logs = (_b = interaction.guild) == null ? void 0 : _b.channels.cache.get(guild == null ? void 0 : guild.logs);
      await (logs == null ? void 0 : logs.send(
        logBuilder({
          member: interaction.member,
          content: `${interaction.user} has cleared **${size}** messages in ${interaction.channel}!`,
          reason: `Bulk delete made by ${interaction.user.tag}`
        })
      ));
    } catch {
      await interaction.reply({ embeds: [errorEmbedBuilder("You can only delete messages that are less than 14 days old.")] });
    }
  }
}
//# sourceMappingURL=clear.js.map
