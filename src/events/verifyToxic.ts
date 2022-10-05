import type { Interaction } from 'discord.js';
import { Events } from 'discord.js';
import { errorEmbedBuilder } from '../utils.js';
import prisma from '../database.js';

export default class RoleDeletions {
	name = Events.InteractionCreate;

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;
		if (!interaction.customId.startsWith('verify_toxic')) return;

		const memberId = interaction.customId.slice(13);
		try {
			const member = await interaction.guild?.members.fetch(memberId);

			const guild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId! },
				select: { members: true },
			});

			const role = interaction.guild?.roles.cache.get(guild?.members!);
			await member?.roles?.add(role!);
			await interaction.message.delete();
		} catch {
			await interaction.reply({ embeds: [errorEmbedBuilder('The member is not in this server')], ephemeral: true });
		}
	}
}
