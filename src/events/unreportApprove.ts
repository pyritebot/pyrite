import type { ButtonInteraction } from "discord.js"
import { Events } from "discord.js";
import prisma from "../database.js";

export default class UnReportApprove {
	name = Events.InteractionCreate

	async run(interaction: ButtonInteraction) {
		if (!interaction.customId?.startsWith('unreport_approve')) return;
		
		const data = interaction.customId.slice(15)
		console.log(data)
		const [_, id, user] = data.split('-')
		
		const oldUser = await prisma.user.findUnique({
			where: { user },
			select: { reports: true }
		})

		const reports = oldUser?.reports?.filter(r => r.id !== id)
		
		await prisma.user.update({
			where: { user },
			data: { reports },
		})

		await interaction.message.delete()
	}
}