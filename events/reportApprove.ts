import type { ButtonInteraction } from "discord.js"
import { Events } from "discord.js";
import prisma from "../database.js";

export default class ReportApprove {
	name = Events.InteractionCreate

	async run(interaction: ButtonInteraction) {
		if (!interaction.customId?.startsWith('report_approve')) return;
		
		const data = interaction.customId.slice(15)
		const [reason, user] = data.split('-')
		
		await prisma.user.upsert({
			where: { user },
			update: { reports: { push: { reason } } },
			create: { user, reports: [{ reason }] }
		})

		await interaction.message.delete();
	}
}