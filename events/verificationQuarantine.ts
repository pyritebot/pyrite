import { Events, GuildMember } from 'discord.js';
import prisma from '../database.js';

export default class VerificationQuarantine {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		if (!member) return;
		
		const oldGuild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { quarantine: true, verificationChannel: true },
		});

		if (!oldGuild?.verificationChannel) return;

		const oldQuarantine = member.guild.roles.cache.get(oldGuild?.quarantine!);

		if (!oldQuarantine) {
			const role = await member.guild?.roles?.create({
				name: 'Quarantine',
			});

			role?.setPermissions([]);

			await prisma.guild.upsert({
				where: { guild: member.guild.id },
				update: { quarantine: role?.id!, verificationChannel: channel.id },
				create: {
					guild: member.guild.id,
					quarantine: role?.id!,
					verificationChannel: channel.id,
				},
			});
		}

		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { quarantine: true },
		});

		const quarantine = member.guild.roles.cache.get(guild?.quarantine!);
		
		await member.roles.add(quarantine!);
	}
}
