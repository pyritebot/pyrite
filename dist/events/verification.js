"use strict";
import {
  Events,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { CaptchaGenerator } from "captcha-canvas";
import { successEmbedBuilder, errorEmbedBuilder, buttons } from "../utils.js";
import emojis from "../emojis.js";
import prisma from "../database.js";
export default class Verification {
  name = Events.InteractionCreate;
  async verify(text, interaction, msg, guild) {
    var _a, _b, _c, _d;
    try {
      const messages = await msg.channel.awaitMessages({
        max: 1,
        time: 1e4,
        errors: ["time"]
      });
      const roles = (_a = interaction.member) == null ? void 0 : _a.roles;
      if (((_b = messages.first()) == null ? void 0 : _b.content) === text) {
        await msg.channel.send({
          embeds: [
            successEmbedBuilder(
              "You have been verified successfully, you can now continue to the server!"
            )
          ]
        });
        const quarantine = (_c = interaction.guild) == null ? void 0 : _c.roles.cache.get(
          (guild == null ? void 0 : guild.quarantine) ?? ""
        );
        if (quarantine) {
          await (roles == null ? void 0 : roles.remove(quarantine));
        }
        const members = (_d = interaction.guild) == null ? void 0 : _d.roles.cache.get(
          (guild == null ? void 0 : guild.members) ?? ""
        );
        if (members) {
          await (roles == null ? void 0 : roles.add(members));
        }
        return;
      }
      const { message: incorrectEmbed, text: incorrectText } = await this.embedBuilder();
      await msg.edit(incorrectEmbed);
      await this.verify(incorrectText, interaction, msg, guild);
    } catch {
      const { message: timeOutEmbed, text: timeOutText } = await this.embedBuilder();
      await msg.edit(timeOutEmbed);
      await this.verify(timeOutText, interaction, msg, guild);
    }
  }
  async embedBuilder() {
    const captcha = new CaptchaGenerator({ width: 450, height: 150 });
    captcha.setDecoy({ total: 30 });
    const buffer = await captcha.generate();
    const file = new AttachmentBuilder(buffer, { name: "verification.png" });
    const verificationEmbed = new EmbedBuilder({
      title: `${emojis.check} Verification`,
      description: "Are you a human? Lets find out. Simply type the following captcha below so I can verify that you are human. The captcha will only last 10 seconds so be quick!",
      image: {
        url: "attachment://verification.png"
      },
      color: 2829617
    });
    return {
      message: {
        embeds: [verificationEmbed],
        components: [buttons],
        files: [file]
      },
      text: captcha.text
    };
  }
  async run(interaction) {
    var _a, _b, _c;
    if (!interaction.inGuild())
      return;
    if (!interaction.isButton())
      return;
    if (interaction.customId !== "verify")
      return;
    await interaction.deferReply({ ephemeral: true });
    const guild = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { quarantine: true, members: true, logs: true }
    });
    const user = await prisma.user.findUnique({
      where: { user: interaction.user.id },
      select: { toxicity: true }
    });
    if (((user == null ? void 0 : user.toxicity) ?? 0) >= 90) {
      await interaction.editReply({
        embeds: [
          errorEmbedBuilder(
            "You have been detected as a dangerous user. Please wait until an admin verifies you."
          )
        ]
      });
      const embed = new EmbedBuilder({
        title: `${emojis.warn} Toxic User Detected!`,
        description: `${interaction.user} has a estimate toxicity of **${(user == null ? void 0 : user.toxicity) ?? 90}%**.
${emojis.blank}${emojis.arrow} What would you like to proceed with? 
${emojis.blank}${emojis.arrow} **Verification was attempted:** <t:${Math.floor(
          Date.now() / 1e3
        )}:R>`,
        color: 2829617,
        thumbnail: {
          url: interaction.user.displayAvatarURL()
        }
      });
      const options = new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            custom_id: `verify_toxic-${interaction.user.id}`,
            label: "Verify",
            style: ButtonStyle.Success
          }),
          new ButtonBuilder({
            custom_id: `kick_toxic-${interaction.user.id}`,
            label: "Kick",
            style: ButtonStyle.Danger
          }),
          new ButtonBuilder({
            custom_id: `ban_toxic-${interaction.user.id}`,
            label: "Ban",
            style: ButtonStyle.Danger
          })
        ]
      });
      const logs = (_a = interaction.guild) == null ? void 0 : _a.channels.cache.get(
        (guild == null ? void 0 : guild.logs) ?? ""
      );
      await (logs == null ? void 0 : logs.send({ embeds: [embed], components: [options] }));
      return;
    }
    if (!((_b = interaction.member) == null ? void 0 : _b.roles).cache.has(
      (guild == null ? void 0 : guild.quarantine) ?? ""
    )) {
      await interaction.editReply({
        embeds: [
          errorEmbedBuilder(
            "It seems that you have already verified. If this is an error, ask an admin to verify you!"
          )
        ]
      });
      return;
    }
    await interaction.editReply({
      embeds: [successEmbedBuilder("Follow instructions on DMs")]
    });
    const { message: initialEmbed, text: initialText } = await this.embedBuilder();
    const msg = await ((_c = interaction.member) == null ? void 0 : _c.send(initialEmbed).catch(async () => {
      await interaction.editReply("You must activate DMs to verify.");
      return;
    }));
    if (!msg)
      return;
    this.verify(initialText, interaction, msg, guild);
  }
}
//# sourceMappingURL=verification.js.map
