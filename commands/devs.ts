import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { join } from 'node:path';
import { buttons } from '../utils.js';

export default class Developers {
	data = new SlashCommandBuilder()
		.setName('devs')
		.setNameLocalizations({ 'es-ES': 'desarrolladores' })
		.setDescription('The official bot developers.')
		.setDescriptionLocalizations({ 'es-ES': 'Los desarrolladores oficiales del bot.' });

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
