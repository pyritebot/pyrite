import type { TextChannel, Message } from "discord.js"
import { Events } from "discord.js";
import { logBuilder } from "../utils.js";
import prisma from "../database.js";

export default class AntiLinks {
	name = Events.MessageUpdate

	async run(_: Message, message: Message) {
		if (!message.inGuild()) return;
		const guild = await prisma.guild.findUnique({
			where: { guild: message.guildId! },
			select: { logs: true, antiLinks: true }
		})
		if (!guild?.antiLinks) return;
		if (message.content.includes('discord.gg/') ||
        message.content.includes('dsc.gg/') ||
        message.content.includes('discord.com/invite/')) {
			await message.delete()
			const logs = message.guild?.channels.cache.get(guild?.logs!) as TextChannel
			await logs?.send(logBuilder({
				member: message.member!,
				reason: `Self promote is not allowed in this server!`,
			}))
		}
	}
}