import { Events, GuildMember } from "discord.js";
import { getQuarantine } from "../utils.js";
import { prisma } from "../database.js";

export default class {
	name = Events.GuildMemberAdd;

	async run(member: GuildMember) {
		if (!member) return;

		const guild = await prisma.guild.findUnique({
			where: { guild: member.guild.id },
			select: { verificationChannel: true },
		});

		if (!guild?.verificationChannel) return;

		const quarantine = await getQuarantine(member.guild);

		if (quarantine) {
			await member.roles.add(quarantine);
		}
	}
}
