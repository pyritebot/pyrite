import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors } from "discord.js";
import { defaultError, errorEmbedBuilder, successEmbedBuilder } from "../utils.js";
import prisma from "../database.js";
export default class Whitelist {
  constructor() {
    this.data = new SlashCommandBuilder().setName("whitelist").setDescription("Turn this on incase of a big raid!").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addSubcommand(
      (subcommand) => subcommand.setName("member").setDescription("The default member role!").addRoleOption((option) => option.setName("role").setDescription("The default member role that will be set").setRequired(true))
    ).addSubcommand(
      (subcommand) => subcommand.setName("mod").setDescription("The default mod role!").addRoleOption((option) => option.setName("role").setDescription("The default moderator role that will be set").setRequired(true))
    ).addSubcommand(
      (subcommand) => subcommand.setName("admin").setDescription("Give a user admin perms (dangerous)").addUserOption((option) => option.setName("user").setDescription("The user that will be made an admin").setRequired(true))
    ).addSubcommand(
      (subcommand) => subcommand.setName("owner").setDescription("Add another owner to your server (very dangerous)").addUserOption((option) => option.setName("user").setDescription("The user that will be made an admin").setRequired(true))
    ).addSubcommand((subcommand) => subcommand.setName("show").setDescription("The all whitelisted roles")).addSubcommand(
      (subcommand) => subcommand.setName("remove").setDescription("Set a whitelist option to defaults or remove an admin/owner").addStringOption(
        (option) => option.setName("setting").setDescription("What setting you wanna change").addChoices(
          {
            name: "member",
            value: "member"
          },
          {
            name: "mod",
            value: "mod"
          },
          {
            name: "admin",
            value: "admin"
          },
          {
            name: "owner",
            value: "owner"
          }
        ).setRequired(true)
      ).addUserOption((option) => option.setName("user").setDescription("What members you want to remove from admin/owner whitelist?"))
    );
  }
  async run(interaction) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
    try {
      const role = interaction.options.getRole("role");
      await interaction.deferReply({ ephemeral: true });
      switch (interaction.options.getSubcommand()) {
        case "member":
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            select: { verificationChannel: true },
            update: { members: role == null ? void 0 : role.id },
            create: {
              guild: interaction.guildId,
              members: role == null ? void 0 : role.id
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully set the **Member** role as ${role}`)] });
          break;
        case "mod":
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { mods: role == null ? void 0 : role.id },
            create: {
              guild: interaction.guildId,
              mods: role == null ? void 0 : role.id
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully set the **Moderator** role as ${role}`)] });
          break;
        case "admin":
          const member = interaction.options.getMember("user");
          const tempGuild2 = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { admins: true }
          });
          if (!member) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("That user in not on this server!")] });
            return;
          }
          if ((_b = tempGuild2 == null ? void 0 : tempGuild2.admins) == null ? void 0 : _b.includes(member.user.id)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("Member is already an admin!")] });
            return;
          }
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { admins: { push: member.id } },
            create: {
              guild: interaction.guildId,
              admins: [member.id]
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully added ${member.user} as an **admin**!`)] });
          break;
        case "owner":
          const owner = interaction.options.getMember("user");
          const tempGuild22 = await prisma.guild.findUnique({
            where: { guild: interaction.guildId },
            select: { owners: true }
          });
          if (!owner) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("That user in not on this server!")] });
            return;
          }
          if ((_c = tempGuild22 == null ? void 0 : tempGuild22.owners) == null ? void 0 : _c.includes(owner.user.id)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("Member is already an owner!")] });
            return;
          }
          await prisma.guild.upsert({
            where: { guild: interaction.guildId },
            update: { owners: { push: owner.id } },
            create: {
              guild: interaction.guildId,
              owners: [owner.id]
            }
          });
          await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully added ${owner.user} as an **owner**!`)] });
          break;
        case "show":
          const NOT_SET = "<:error:1009134465995509810> Not Set";
          const guild = await prisma.guild.findUnique({
            where: {
              guild: interaction.guildId
            },
            select: {
              members: true,
              mods: true,
              admins: true,
              owners: true
            }
          });
          const showEmbed = new EmbedBuilder({
            title: `<:staff:1008719693827285002> Whitelisted Roles`,
            description: "> All the current whitelisted roles.",
            fields: [
              { name: "Members", value: `${(guild == null ? void 0 : guild.members) ? `<@&${guild == null ? void 0 : guild.members}>` : NOT_SET}` },
              { name: "Mods", value: `${(guild == null ? void 0 : guild.mods) ? `<@&${guild == null ? void 0 : guild.mods}>` : NOT_SET}` },
              { name: "Admins", value: `${((_d = guild == null ? void 0 : guild.admins) == null ? void 0 : _d.length) ? guild.admins.reduce((acc, val) => acc.concat(`<@${val}>
`), "") : NOT_SET}` },
              { name: "Owners", value: `${((_e = guild == null ? void 0 : guild.owners) == null ? void 0 : _e.length) ? guild.owners.reduce((acc, val) => acc.concat(`<@${val}>
`), "") : NOT_SET}` }
            ],
            color: Colors.Blurple
          });
          await interaction.editReply({ embeds: [showEmbed] });
          break;
        case "remove":
          const setting = interaction.options.getString("setting");
          switch (setting) {
            case "member":
              await prisma.guild.upsert({
                where: { guild: interaction.guildId },
                update: { members: null },
                create: { guild: interaction.guildId, members: null }
              });
              await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully resetted member role to default!`)] });
              break;
            case "mod":
              await prisma.guild.upsert({
                where: { guild: interaction.guildId },
                update: { mods: null },
                create: { guild: interaction.guildId, mods: null }
              });
              await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully resetted mod role to default!`)] });
              break;
            case "admin":
              const member2 = interaction.options.getMember("user");
              const tempGuild3 = await prisma.guild.findUnique({
                where: { guild: interaction.guildId },
                select: { admins: true }
              });
              if (!((_f = tempGuild3 == null ? void 0 : tempGuild3.admins) == null ? void 0 : _f.length)) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("No admins in this server")] });
                return;
              }
              if (!member2) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("That user in not on this server!")] });
                return;
              }
              const newAdmins = (_g = tempGuild3 == null ? void 0 : tempGuild3.admins) == null ? void 0 : _g.filter((admin) => {
                var _a2;
                return admin !== ((_a2 = member2 == null ? void 0 : member2.user) == null ? void 0 : _a2.id);
              });
              if (JSON.stringify(tempGuild3 == null ? void 0 : tempGuild3.admins) === JSON.stringify(newAdmins)) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("That user is not an admin!")] });
                return;
              }
              await prisma.guild.upsert({
                where: { guild: interaction.guildId },
                update: { admins: newAdmins },
                create: { guild: interaction.guildId }
              });
              await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully removed ${member2.user} as an admin!`)] });
              break;
            case "owner":
              const owner2 = interaction.options.getMember("user");
              const tempGuild23 = await prisma.guild.findUnique({
                where: { guild: interaction.guildId },
                select: { owners: true }
              });
              if (!((_h = tempGuild23 == null ? void 0 : tempGuild23.owners) == null ? void 0 : _h.length)) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("No admins in this server")] });
                return;
              }
              if (!owner2) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("That user in not on this server!")] });
                return;
              }
              const newOwners = (_i = tempGuild23 == null ? void 0 : tempGuild23.owners) == null ? void 0 : _i.filter((o) => {
                var _a2;
                return o !== ((_a2 = owner2 == null ? void 0 : owner2.user) == null ? void 0 : _a2.id);
              });
              if (JSON.stringify(tempGuild23 == null ? void 0 : tempGuild23.owners) === JSON.stringify(newOwners)) {
                await interaction.editReply({ embeds: [errorEmbedBuilder("That user is not an admin!")] });
                return;
              }
              await prisma.guild.upsert({
                where: { guild: interaction.guildId },
                update: { owners: newOwners },
                create: { guild: interaction.guildId }
              });
              await interaction.editReply({ embeds: [successEmbedBuilder(`Successfully removed ${owner2 == null ? void 0 : owner2.user} as an owner!`)] });
              break;
          }
      }
    } catch {
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=whitelist.js.map
