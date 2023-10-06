import type { Message, TextChannel } from "discord.js";
import { EmbedBuilder, Events } from "discord.js";
import { prisma } from "../database.js";
import { analyzeText } from "../utils.js";

export default class {
	name = Events.MessageCreate;

	async run(message: Message) {
		if (!message.inGuild()) return;
		if (message.author.id === message.client.user?.id) return;
		if (message.author.bot) return;

		try {
			const guild = await prisma.guild.findUnique({
				where: { guild: message.guildId },
				select: { logs: true, toxicityFilter: true },
			});

			const level = await analyzeText(message.content);
			const danger = Math.ceil(level);

			const user = await prisma.user.findUnique({
				where: { user: message.author.id },
				select: { toxicity: true },
			});

			if (danger < 20) {
				await prisma.user.upsert({
					where: { user: message.author.id },
					update: { toxicity: { decrement: 0.2 } },
					create: { user: message.author.id },
				});
				if ((user?.toxicity ?? 0) - 0.2 <= 0) {
					await prisma.user.upsert({
						where: { user: message.author.id },
						update: { toxicity: 0 },
						create: { user: message.author.id },
					});
				}
			} else if (danger > 80) {
				if (!guild?.toxicityFilter) return;
				await prisma.user.upsert({
					where: { user: message.author.id },
					update: { toxicity: { increment: 2.5 } },
					create: { user: message.author.id, toxicity: 2.5 },
				});
				if ((user?.toxicity ?? 0) + 2.5 >= 100) {
					await prisma.user.upsert({
						where: { user: message.author.id },
						update: { toxicity: 2.5 },
						create: { user: message.author.id, toxicity: 2.5 },
					});
				}
			}

			if (!guild?.toxicityFilter) return;
			if (danger < 90) return;

			await message.delete();
			const embed = new EmbedBuilder({
				author: {
					name: message.author.tag,
					icon_url: message.author.displayAvatarURL(),
				},
				title: "Toxic message detected!",
				description: `
A user was detected being toxic in a channel, here are the details below:
    
    <:arrow:1068604670764916876> **Message:** ||${message.content}||  
    <:arrow:1068604670764916876> **Channel:** ${message.channel} 
<:arrow:1068604670764916876> **Reason:** toxicity`,
				color: 0x2b2d31,
				footer: {
					text: message.guild?.name ?? "",
					icon_url: message.guild?.iconURL() ?? "",
				},
				timestamp: new Date().toISOString(),
			});

			const logs = message.guild.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel | null;

			await logs?.send({ embeds: [embed] });
		} catch {
			return;
		}
	}
}
