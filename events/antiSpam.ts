import type { Message, TextChannel } from "discord.js";
import { Events, Collection, ChannelType } from "discord.js";
import prisma from "../database.js";
import { logBuilder } from "../utils.js";

export default class AntiSpam {
	name = Events.MessageCreate;

	static users = new Collection<string, number>();
	static timeout = (id: string) =>
		setTimeout(() => {
			AntiSpam.users.delete(id);
		}, 10_000);

	async purge(message: Message<true>, minutes: number, limit: number) {
		await message.member?.timeout(60_000 * minutes, "spamming");
		const messages = [
			...message.channel.messages.cache
				.filter((m) => m.author.id === message.author.id)
				.values(),
		].slice(0, limit);
		await (message.channel as TextChannel).bulkDelete(messages);
	}

	async run(message: Message<true>) {
		if (!message.inGuild()) return;

		if (message.channel.type !== ChannelType.GuildText) return;

		const guild = await prisma.guild.findUnique({
			where: { guild: message.guildId },
			select: {
				antiSpam: true,
				admins: true,
				owners: true,
				spamMinutes: true,
				spamMessageLimit: true,
				logs: true,
			},
		});

		if (!guild?.antiSpam) return;
		if (
			guild?.admins.includes(message.author.id) ||
			guild?.owners.includes(message.author.id) ||
			message.author.id === message.guild.ownerId
		)
			return;

		AntiSpam.timeout(message.author.id).refresh();

		const minutes = guild?.spamMinutes;
		const limit = guild?.spamMessageLimit;
		const msgCount =
			(AntiSpam.users.get(message.author.id ?? message.webhookId) ?? 0) + 1;

		if (message.author.id === message.client.user?.id) return;

		if (!AntiSpam.users.has(message.author.id)) {
			AntiSpam.users.set(message.author.id, 1);
			return;
		}

		if (msgCount === limit) {
			await this.purge(message, minutes, limit).catch(() => {
				message.guild.roles.cache
					.filter((r) => r.id !== message.guildId)
					.forEach(async (r) => {
						await message.member?.roles
							.remove(r, "Spamming")
							.catch(async () => {
								if (!message.author.bot) return;
								await r.setPermissions([], "Spamming").catch(() => {});
								await this.purge(message, minutes, limit).catch(() => {});
								AntiSpam.users.set(
									message.author.id ?? message.webhookId,
									msgCount,
								);
							});

						await this.purge(message, minutes, limit).catch(() => {});
						AntiSpam.users.set(message.author.id, msgCount);
					});
			});

			const webhooks = await message.channel.fetchWebhooks();
			const webhook = webhooks?.find((w) => w.id === message.webhookId);
			await webhook?.delete("Spamming")?.catch(() => {});

			const logs = message.guild.channels.cache.get(
				guild?.logs ?? "",
			) as TextChannel | null;
			await logs?.send(
				logBuilder({
					reason: `Was detected spamming. Webhook: ${!!message.webhookId}!`,
					guild: message.guild,
					punished: true,
					member: message.member || `<@${message.webhookId}>`,
				}),
			);
		}

		AntiSpam.users.set(message.author.id, msgCount);
	}
}
