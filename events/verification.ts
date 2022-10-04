import type { GuildMemberRoleManager, Interaction, Message, Message } from "discord.js"
import { Events, AttachmentBuilder, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CaptchaGenerator } from "captcha-canvas";
import { successEmbedBuilder, errorEmbedBuilder } from "../utils.js";
import prisma from "../database.js";

export default class Verification {
  name = Events.InteractionCreate
	
  async verify(text: string, interaction: Interaction, msg: Message, guild: { members: string | null } | null) {
    try {
      const messages = await msg.channel.awaitMessages({ max: 1, time: 10_000, errors: ["time"] })

      const roles = interaction.member?.roles as GuildMemberRoleManager | null

      if (messages.first()?.content === text) {
        await msg.channel.send({ embeds: [successEmbedBuilder('Successfully verified you!')] })
        const role = interaction.guild?.roles.cache.get(guild?.members!)
        await roles?.add(role!)
        return;
      }

      const {
        message: incorrectEmbed,
        text: incorrectText,
      } = await this.embedBuilder()

      await msg.edit(incorrectEmbed)
      await this.verify(
        incorrectText,
        interaction,
        msg,
        guild,
      )
    } catch {
      const {
        message: timeOutEmbed,
        text: timeOutText,
      } = await this.embedBuilder()

      await msg.edit(timeOutEmbed)
      await this.verify(
        timeOutText,
        interaction,
        msg,
        guild,
      )
    }
  }

  async embedBuilder() {
    const captcha = new CaptchaGenerator({ width: 450, height: 150 })
      .setCaptcha({ color: '#5865f2' })
      .setTrace({ color: "#5865f2" });

    const buffer = await captcha.generate()

    const file = new AttachmentBuilder(buffer, { name: 'verification.png' });
    const verificationEmbed = new EmbedBuilder({
      title: '<:check:1008718056891101194> Verification',
      description: `<:1412reply:1009087336828649533> Are you a human? Lets find out. Simply type the following captcha below so I can verify that you are human. The captcha will only last 10 seconds so be quick!`,
      image: {
        url: 'attachment://verification.png'
      },
      color: Colors.Blurple,
    })

    return {
      message: { embeds: [verificationEmbed], files: [file] },
      text: captcha.text
    }
  }

  async run(interaction: Interaction) {
    if (!interaction.inGuild()) return;

    if (!interaction.isButton()) return;
    if (interaction.customId !== 'verify') return;

    await interaction.deferReply({ ephemeral: true })

    const guild = await prisma.guild.findUnique({
      where: { guild: interaction.guildId },
      select: { members: true, logs: true }
    })

    const user = await prisma.user.findUnique({
      where: { user: interaction.user.id },
      select: { toxicity: true, reports: true }
    })

		if (((user?.toxicity ?? 0) >= 90)) {
			await interaction.editReply({ embeds: [errorEmbedBuilder('You have been detected as a dangerous user. Please wait until an admin verifies you.')] })
			
			const embed = new EmbedBuilder({
				title: '<:warn:1009191992040894657> Toxic User Detected!',
				description: `${interaction.user} has a estimate toxicity of **${user?.toxicity ?? 0}%**, and **${user?.reports?.length ?? 0} reports.**
<:blank:1008721958210383902> <:arrow:1009057573590290452> What would you like to proceed with? 
<:blank:1008721958210383902> <:arrow:1009057573590290452> **Verification was attempted:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        color: Colors.Blurple,
        thumbnail: {
          url: interaction.user.displayAvatarURL(),
        },
			})

			const options = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						custom_id: `verify_toxic-${interaction.user.id}`,
            label: 'Verify',
            style: ButtonStyle.Primary,
						
					}),
          new ButtonBuilder({
						custom_id: `kick_toxic-${interaction.user.id}`,
            label: 'Kick',
            style: ButtonStyle.Success
					}),
					new ButtonBuilder({
						custom_id: `ban_toxic-${interaction.user.id}`,
            label: 'Ban',
            style: ButtonStyle.Danger,
					}),
				]
			})

			const logs = interaction.guild?.channels.cache.get(guild?.logs!)
			await logs?.send({ embeds: [embed], components: [options] })

			return;
		}

    if ((interaction.member?.roles as GuildMemberRoleManager).cache.has(guild?.members!)) {
      await interaction.editReply({ embeds: [errorEmbedBuilder('You are already verified!')] })
      return;
    }

    await interaction.editReply({ content: 'Follow the instructions on DM!' })

    const {
      message: initialEmbed,
      text: initialText,
    } = await this.embedBuilder()
    const msg = await (interaction.member as Message | null)?.send(initialEmbed).catch(async () => {
			await interaction.editReply('You must activate DMs to verify.')
			return;
		})

		if (!msg) return;

    this.verify(
      initialText,
      interaction,
      msg!,
      guild
    )
  }
}