import { Events, GuildMember } from 'discord.js';
import { getQuarantine } from '../utils.js'
import prisma from '../database.js';

export default class VerificationQuarantine {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		if (!member) return;
		
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { verificationChannel: true },
		});

		if (!guild?.verificationChannel) return;

		const quarantine = await getQuarantine(member.guild)
		
		await member.roles.add(quarantine!);
	}
}
