import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";
import { defaultError, errorEmbedBuilder, logBuilder, successEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Verification {
  constructor() {
    this.data = new SlashCommandBuilder().setName("verification").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).setDescription("Set verification in your server and configure it!").addSubcommand(
      (subcommand) => subcommand.setName("on").setDescription("Turn on verification.").addChannelOption((option) => option.setName("channel").setDescription("The verification channel").setRequired(true))
    ).addSubcommand((subcommand) => subcommand.setName("off").setDescription("Turn off verification."));
  }
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      switch (interaction.options.getSubcommand()) {
        case "on":
          const channel = interaction.options.getChannel("channel");
          if ((channel == null ? void 0 : channel.type) !== ChannelType.GuildText) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("The channel must be a Text Channel.")] });
            return;
          }
          (_a = interaction.guild) == null ? void 0 : _a.roles.everyone.setPermissions(
            [PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.UseExternalEmojis],
            "Turning verification on"
          );
          const oldGuild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { members: true }
          });
          if (!(oldGuild == null ? void 0 : oldGuild.members)) {
            const role = await ((_c = (_b = interaction.guild) == null ? void 0 : _b.roles) == null ? void 0 : _c.create({
              name: "Members"
            }));
            await prisma.guild.upsert({
              where: { guild: interaction.guildId },
              update: { members: role == null ? void 0 : role.id, verificationChannel: channel.id },
              create: {
                guild: interaction.guildId,
                verificationChannel: channel.id
              }
            });
          }
          const guild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { members: true, logs: true }
          });
          channel.permissionOverwrites.edit(interaction.guildId, { ViewChannel: true, SendMessages: false });
          channel.permissionOverwrites.edit(guild == null ? void 0 : guild.members, { ViewChannel: false });
          const verificationButtons = new ActionRowBuilder({
            components: [
              new ButtonBuilder({
                label: "Verify",
                style: ButtonStyle.Success,
                custom_id: "verify"
              }),
              new ButtonBuilder({
                label: "Support Server",
                style: ButtonStyle.Link,
                url: "https://discord.gg/NxJzWWqhdQ"
              })
            ]
          });
          const verificationEmbed = new EmbedBuilder({
            title: "<:check:1027354811164786739> Verification",
            description: `<:blank:1008721958210383902> <:arrow:1009057573590290452> To access \`${interaction.guild.name}\` you must complete the verification process. 
<:blank:1008721958210383902><:blank:1008721958210383902><:1412reply:1009087336828649533> Press on the **Verify** button below.`,
            color: Colors.Green
          });
          await channel.send({ embeds: [verificationEmbed], components: [verificationButtons] });
          await interaction.editReply({
            embeds: [successEmbedBuilder(`Successfully activated verification! (<@&${guild == null ? void 0 : guild.members}>)`)]
          });
          const onLogs = (_d = interaction.guild) == null ? void 0 : _d.channels.cache.get(guild == null ? void 0 : guild.logs);
          onLogs == null ? void 0 : onLogs.send(
            logBuilder({
              member: interaction.member,
              content: `${interaction.user} has turned verification on!`,
              reason: `Verification turned on by ${interaction.user.tag}`
            })
          );
          break;
        case "off":
          const tempGuild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { verificationChannel: true, logs: true }
          });
          const tempChannel = (_g = (_f = (_e = interaction.guild) == null ? void 0 : _e.channels) == null ? void 0 : _f.cache) == null ? void 0 : _g.get(tempGuild == null ? void 0 : tempGuild.verificationChannel);
          await (tempChannel == null ? void 0 : tempChannel.delete());
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { verificationChannel: null },
            create: { guild: interaction.guildId }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder("Successfully deactivated verification in this server!")] });
          const offLogs = (_h = interaction.guild) == null ? void 0 : _h.channels.cache.get(tempGuild == null ? void 0 : tempGuild.logs);
          offLogs == null ? void 0 : offLogs.send(
            logBuilder({
              member: interaction.member,
              content: `${interaction.user} has turned verification off!`,
              reason: `Verification turned off by ${interaction.user.tag}`
            })
          );
          break;
      }
    } catch (err) {
      await interaction.editReply(defaultError);
      console.error(err);
    }
  }
}
//# sourceMappingURL=verification.js.map
