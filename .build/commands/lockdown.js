import { SlashCommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { defaultError, errorEmbedBuilder, successEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Lockdown {
  constructor() {
    this.data = new SlashCommandBuilder().setName("lockdown").setDescription("Lockdown the entire server!").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand((subcommand) => subcommand.setName("on").setDescription("turn the lockdown on!")).addSubcommand((subcommand) => subcommand.setName("off").setDescription("turn the lockdown off!")).addSubcommand(
      (subcommand) => subcommand.setName("update").setDescription("Post an update on the lockdown!").addStringOption(
        (message) => message.setName("message").setDescription("The update message that will be posted during lockdown").setRequired(true)
      )
    );
  }
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f;
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder("This command can only be run on a server!")] });
      return;
    }
    const tempGuild = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { owners: true }
    });
    if (!((tempGuild == null ? void 0 : tempGuild.owners.includes(interaction.user.id)) || ((_a = interaction.guild) == null ? void 0 : _a.ownerId) === interaction.user.id)) {
      await interaction.reply({ embeds: [errorEmbedBuilder("Only an owner can use the whitelist.")], ephemeral: true });
      return;
    }
    switch (interaction.options.getSubcommand()) {
      case "on":
        const confirm = new ActionRowBuilder({
          components: [
            new ButtonBuilder({
              label: "Continue",
              style: ButtonStyle.Danger,
              custom_id: "lockdown_continue"
            }),
            new ButtonBuilder({
              label: "Cancel",
              style: ButtonStyle.Secondary,
              custom_id: "lockdown_cancel"
            })
          ]
        });
        const lockdownOnEmbed = new EmbedBuilder({
          title: "<:warn:1027361416119853187> Warning!",
          description: "The lockdown goes through the entire server and lock every channel and remove all role permissions, and no new members will be able to enter your server while it's on!",
          color: Colors.Yellow
        });
        await interaction.reply({ embeds: [lockdownOnEmbed], components: [confirm], ephemeral: true });
        break;
      case "off":
        try {
          await interaction.deferReply({ ephemeral: true });
          const guild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: {
              lockdownChannel: true,
              verificationChannel: true
            }
          });
          if (!(guild == null ? void 0 : guild.lockdownChannel)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("Lockdown has not been activated in this server!")] });
            return;
          }
          const lockdownChannel = await ((_b = interaction.guild) == null ? void 0 : _b.channels.fetch(guild == null ? void 0 : guild.lockdownChannel));
          await (lockdownChannel == null ? void 0 : lockdownChannel.delete("Lockdown has been turned off"));
          await prisma.guild.update({
            where: {
              guild: interaction.guildId
            },
            data: {
              raidMode: false,
              lockdownChannel: null,
              lockdownMessage: null
            }
          });
          (_c = interaction.guild) == null ? void 0 : _c.channels.cache.forEach((ch) => {
            var _a2;
            const c = ch;
            (_a2 = interaction.guild) == null ? void 0 : _a2.roles.cache.filter((role) => role.id !== "@everyone" && role.id !== (guild == null ? void 0 : guild.verificationChannel)).forEach(async (role) => await c.permissionOverwrites.edit(role.id, { SendMessages: true }));
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`Lockdown is now off.`)] });
        } catch {
          await interaction.editReply(defaultError);
        }
        break;
      case "update":
        const content = interaction.options.getString("message");
        await interaction.deferReply({ ephemeral: true });
        try {
          const guild = await prisma.guild.findUnique({
            where: {
              guild: interaction.guildId
            },
            select: {
              lockdownMessage: true,
              lockdownChannel: true
            }
          });
          if (!((guild == null ? void 0 : guild.lockdownChannel) || (guild == null ? void 0 : guild.lockdownMessage))) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("lockdown has not been activated in this server!")] });
            return;
          }
          const channel = (_d = interaction.guild) == null ? void 0 : _d.channels.cache.get(guild == null ? void 0 : guild.lockdownChannel);
          const message = await ((_e = channel == null ? void 0 : channel.messages) == null ? void 0 : _e.fetch(guild == null ? void 0 : guild.lockdownMessage));
          const embed = message == null ? void 0 : message.embeds[0];
          const newEmbed = { ...embed == null ? void 0 : embed.data };
          newEmbed.fields ??= [];
          newEmbed.fields.push({
            name: `<:arrow:1009057573590290452> Update #${(((_f = embed == null ? void 0 : embed.fields) == null ? void 0 : _f.length) ?? 0) + 1}`,
            value: `<:1412reply:1009087336828649533> ${content}`
          });
          await (message == null ? void 0 : message.edit({ embeds: [newEmbed] }));
        } catch {
          await interaction.editReply(defaultError);
          break;
        }
        await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully posted the lockdown update!`)] });
        break;
    }
  }
}
//# sourceMappingURL=lockdown.js.map
