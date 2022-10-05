import type { ButtonInteraction } from 'discord.js';
import { Events } from 'discord.js';

export default class ReportApprove {
	name = Events.InteractionCreate;

	async run(interaction: ButtonInteraction) {
		if (!interaction.customId?.startsWith('report_reject')) return;

		await interaction.message.delete();
	}
}
