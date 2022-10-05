import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder, defaultError } from "../utils.js";
import prisma from "../database.js";
export default class Logger {
  constructor() {
    this.data = new SlashCommandBuilder().setName("logs").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDescription("Manage the custom logger to see the actions that your mods and members do in the server").addSubcommand(
      (subcommand) => subcommand.setName("on").setDescription("Turn logging on and select a channel to send the logs").addChannelOption((option) => option.setName("channel").setDescription("The channel where all the logs should go.").setRequired(true))
    ).addSubcommand((subcommand) => subcommand.setName("off").setDescription("Turn logging off"));
  }
  async run(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    try {
      await interaction.deferReply({ ephemeral: true });
      switch (interaction.options.getSubcommand()) {
        case "on":
          const channel = interaction.options.getChannel("channel");
          if (channel.type !== ChannelType.GuildText) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("The channel must be a Text Channel.")] });
            return;
          }
          await prisma.guild.upsert({
            where: {
              guild: interaction.guildId
            },
            update: {
              logs: channel.id
            },
            create: {
              guild: interaction.guildId,
              logs: channel.id
            }
          });
          await channel.send({ embeds: [successEmbedBuilder("The logging channel was successfully set here!")] });
          await interaction.editReply({ embeds: [successEmbedBuilder(`The logs channel has now been set to ${channel}`)] });
          return;
        case "off":
          const guild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { logs: true }
          });
          if (!(guild == null ? void 0 : guild.logs)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("Logs are not turned on in this server")] });
            return;
          }
          await prisma.guild.update({
            where: { guild: interaction.guildId },
            data: { logs: null }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder("Deactivated logs on this server!")] });
          return;
      }
      return;
    } catch (err) {
      console.error();
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=logs.js.map
