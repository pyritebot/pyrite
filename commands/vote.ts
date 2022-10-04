import type { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle  } from "discord.js";

export default class Help {
	data = new SlashCommandBuilder()
		.setName('vote')
		.setDescription("Vote our bot to help us!")

	async run(interaction: CommandInteraction) {
		const embed = new EmbedBuilder({
			title: '<:pyrite:1014918476982394891> Vote Us!',
			description: '<:blank:1008721958210383902><:arrow:1009057573590290452> By voting us, you help us grow and protect more servers! Please take 1 minute of your time to help us get to more servers.',
      color: Colors.Blurple
		})

		const buttons = new ActionRowBuilder<ButtonBuilder>({
			components: [
				new ButtonBuilder({
					label: 'Top.gg',
					style: ButtonStyle.Link,
					url: 'https://top.gg/bot/1008400801628164096'
				}),
				new ButtonBuilder({
					label: 'Discord Bot List',
					style: ButtonStyle.Link,
					url: 'https://discord.ly/pyrite'
				}),
			]
		})
		
    await interaction.reply({ embeds: [embed], components: [buttons] })
  }
}