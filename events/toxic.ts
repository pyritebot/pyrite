import type { Interaction } from 'discord.js';
import { Events } from 'discord.js';
import { successEmbedBuilder, errorEmbedBuilder, getQuarantine } from '../utils.js';
import prisma from '../database.js';


export default class RoleDeletions {
	name = Events.InteractionCreate;

	async run(interaction: Interaction) {
		if (!interaction.isButton()) return;

		const [_, memberId] = interaction.customId.split('-');
		const member = await interaction.guild?.members.fetch(memberId);

		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder('The member is not in this server')], ephemeral: true });
			return;
		}
		
		if (interaction.customId.startsWith('kick_toxic')) {
			
			const user = member.user;
	
			await member.kick('toxicity levels higher than normal');
			await interaction.message.delete();
			
		} else if (interaction.customId.startsWith('ban_toxic')) {
			
			const user = member.user;
	
			await member.ban({ reason: 'toxicity levels higher than normal' });
			await interaction.message.delete();
			
		} else if (interaction.customId.startsWith('verify_toxic')) {

			const guild = await prisma.guild.findUnique({
				where: { guild: interaction.guildId! },
				select: { members: true },
			});
	
			const role = interaction.guild?.roles.cache.get(guild?.members!);
			
			await member?.roles?.add(role!);
			await interaction.message.delete();
			
		}
	}
}
