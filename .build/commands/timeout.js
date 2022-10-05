import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { errorEmbedBuilder, successEmbedBuilder, logBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Mute {
  constructor() {
    this.data = new SlashCommandBuilder().setName("timeout").setDescription("Timeouts a user from the server.").setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers).addUserOption((option) => option.setName("user").setDescription("Select the user (or user id) to timeout them.").setRequired(true)).addIntegerOption((option) => option.setName("minutes").setDescription("The minutes the user will be timeouted for.").setRequired(true)).addStringOption(
      (option) => option.setName("reason").setDescription("You can pass a string with a reason for timeouting the user.").setRequired(true)
    );
  }
  async run(interaction) {
    var _a, _b, _c, _d;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    const member = interaction.options.getMember("user");
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason", true);
    if (!((_d = (_c = (_b = (_a = interaction.guild) == null ? void 0 : _a.members) == null ? void 0 : _b.me) == null ? void 0 : _c.permissions) == null ? void 0 : _d.has(PermissionFlagsBits.MuteMembers))) {
      await interaction.reply({ embeds: [errorEmbedBuilder("The bot doesn't have permissions to timeout members!")], ephemeral: true });
      return;
    }
    if (!member) {
      await interaction.reply({ embeds: [errorEmbedBuilder("Member could not be found!")], ephemeral: true });
      return;
    }
    try {
      await member.timeout(minutes * 6e4, reason);
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbedBuilder(`${member.user} cannot be timeouted!`)], ephemeral: true });
      return;
    }
    await interaction.reply({ embeds: [successEmbedBuilder(`${member.user} was sucessfully timeouted.`)], ephemeral: true });
    const guild = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { logs: true }
    });
    const logs = interaction.guild.channels.cache.get(guild == null ? void 0 : guild.logs);
    await (logs == null ? void 0 : logs.send(
      logBuilder({
        member: interaction.member,
        content: `${member.user} has been muted by ${interaction.user}!`,
        reason
      })
    ));
  }
}
//# sourceMappingURL=timeout.js.map
