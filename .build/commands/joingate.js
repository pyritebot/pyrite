import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { defaultError, errorEmbedBuilder, logBuilder, successEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class RaidMode {
  constructor() {
    this.data = new SlashCommandBuilder().setName("joingate").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDescription("Dont allow members to join your server").addSubcommand((subcommand) => subcommand.setName("on").setDescription("turn the join gate on!")).addSubcommand((subcommand) => subcommand.setName("off").setDescription("turn the join gate off!"));
  }
  async run(interaction) {
    var _a, _b, _c, _d;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    try {
      await interaction.deferReply({ ephemeral: true });
      const adminsGuild = await prisma.guild.findUnique({
        where: { guild: interaction.guildId },
        select: { admins: true }
      });
      if (!(((_a = adminsGuild == null ? void 0 : adminsGuild.admins) == null ? void 0 : _a.includes(interaction.user.id)) || interaction.user.id === ((_b = interaction.guild) == null ? void 0 : _b.ownerId))) {
        await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to toggle the join gate")] });
        return;
      }
      switch (interaction.options.getSubcommand()) {
        case "on":
          const onGuild = await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { raidMode: true },
            create: {
              guild: interaction.guildId,
              raidMode: true
            }
          });
          const onLogs = (_c = interaction.guild) == null ? void 0 : _c.channels.cache.get(onGuild == null ? void 0 : onGuild.logs);
          await (onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Join gate has been activated by ${interaction.user}!`,
              reason: `Join gate feature has been activated by ${interaction.user.tag}`
            })
          ));
          await interaction.editReply({ embeds: [successEmbedBuilder("The Join Gate is now currently active.")] });
          break;
        case "off":
          const guild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { raidMode: true, logs: true }
          });
          if (!(guild == null ? void 0 : guild.raidMode)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("The Join Gate has not been activated in this server!")] });
            return;
          }
          await prisma.guild.update({
            where: { guild: interaction.guildId },
            data: { raidMode: false }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder("The Join Gate is now currently off")] });
          const offLogs = (_d = interaction.guild) == null ? void 0 : _d.channels.cache.get(guild == null ? void 0 : guild.logs);
          await (offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              content: `Join gate has been deactivated by ${interaction.user}!`,
              reason: `Join gate feature has been deactivated by ${interaction.user.tag}`
            })
          ));
          break;
      }
    } catch {
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=joingate.js.map
