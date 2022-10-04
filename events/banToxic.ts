import type { Interaction } from "discord.js"
import { Events } from "discord.js";
import { successEmbedBuilder, errorEmbedBuilder } from "../utils.js";

export default class RoleDeletions {
	name = Events.InteractionCreate

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		if (!interaction.customId.startsWith('ban_toxic')) return;

		const memberId = interaction.customId.slice(10)
		try {
			const member = await interaction.guild?.members.fetch(memberId)
		
			const user = member.user
	
			await member?.ban({ reason: 'toxicity levels higher than normal' })
			
			await interaction.reply({ embeds: [successEmbedBuilder(`Successfully banned ${user}!`)], ephemeral: true })
			await interaction.message.delete()
		} catch {
			await interaction.reply({ embeds: [errorEmbedBuilder('The member is not in this server')], ephemeral: true })
		}
	}
}