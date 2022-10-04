import type { TextChannel, Message } from "discord.js"
import { Events, EmbedBuilder, Colors } from "discord.js";
import prisma from "../database.js";

export default class AntiAlts {
	name = Events.GuildMemberAdd

	async run(member: Message) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild?.id! },
			select: { logs: true, antiAlts: true }
		})
		if (!guild?.antiAlts) return;
		const accAge = Math.abs(Date.now() - member.user.createdTimestamp);
		const accDays = Math.ceil(accAge / (1000 * 60 * 60 * 24));
		if (accDays <= 7) {
			const user = member.user
			await member.kick('This account was detected as a alternative account')
			const logs = member.guild?.channels.cache.get(guild?.logs!) as TextChannel
			
			const embed = new EmbedBuilder({
				title: 'Alt Account Detected!',
				description: `<:arrow:1009057573590290452> ${user} was detected as a alternative account.
        <:blank:1008721958210383902> They were kicked by the **Anti Alts system**
        <:blank:1008721958210383902> This happened at: <t:${Math.floor(Date.now() / 1000)}:R>`,
				thumbnail: {
					url: user.displayAvatarURL(),
				},
        color: Colors.Blurple
      })

			await logs?.send({ embeds: [embed] })
		}
	}
}