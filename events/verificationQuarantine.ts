import { Events, GuildMember } from 'discord.js';
import prisma from '../database';

export default class VerificationQuarantine {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { quarantine: true },
		});

		const quarantine = member.guild.roles.cache.get(guild?.quarantine!);
		await member.roles.add(quarantine!);
	}
}
