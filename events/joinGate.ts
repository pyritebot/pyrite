import type { GuildMember } from 'discord.js'
import { Events, EmbedBuilder } from 'discord.js'
import prisma from '../database.js'

export default class JoinGate {
	name = Events.GuildMemberAdd

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { raidMode: true },
		});
	
		if (!guild?.raidMode) return;
	
		const raidModeEmbed = new EmbedBuilder({
			author: {
				name: member.guild.name,
				icon_url: member.guild.iconURL()!,
			},
			description: `<:arrow:1068604670764916876> **Join Gate** is currently active in this server. Meaning no one can join at the moment.`,
			color: 0x2f3136,
		});
	
		await member.send({ embeds: [raidModeEmbed] });
		await member.kick('Join Gate System');
	}
}