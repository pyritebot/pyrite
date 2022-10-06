import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { join } from 'node:path';
import { buttons } from '../utils.js';

export default class Developers {
	data = new SlashCommandBuilder()
		.setName('devs')
		.setNameLocalizations({ 'es-ES': 'desarrolladores' })
		.setDescription('The Official Bot Developers')
		.setDescriptionLocalizations({ 'es-ES': 'Los Desarrolladores Oficiales del Bot' });

	async run(interaction: ChatInputCommandInteraction) {
		await interaction.reply({
			files: [
				new AttachmentBuilder(join(process.cwd(), './assets/angelnext.png'), { name: 'angelnext.png' }),
				new AttachmentBuilder(join(process.cwd(), './assets/eldi.png'), { name: 'eldi.png' }),
			],
			components: [buttons],
		});
	}
}
