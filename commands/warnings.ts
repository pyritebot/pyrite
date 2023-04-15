import type { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, TextChannel } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultError, errorEmbedBuilder, successEmbedBuilder, addWarn, logBuilder } from '../utils.js';
import emojis from '../emojis.js';
import prisma from '../database.js';

export default class Warnings {
	data = new SlashCommandBuilder()
		.setName('warnings')
		.setDescription('Use this command to manage the warnings in your server!')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setNameLocalizations({ 'es-ES': 'advertir' })
				.setDescription('Warn a user!')
				.setDescriptionLocalizations({ 'es-ES': 'Advierte a un usuario!' })
				.addUserOption(option =>
					option
						.setName('member')
						.setNameLocalizations({ 'es-ES': 'miembro' })
						.setDescription('You can pass a mention or an id of a member.')
						.setDescriptionLocalizations({ 'es-ES': 'Puedes pasar una mención o un id de un miembro.' })
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('reason')
						.setNameLocalizations({ 'es-ES': 'razón' })
						.setDescription('You must provide a reason for this warning')
						.setDescriptionLocalizations({ 'es-ES': 'Debes proveer una razón para esta advertencia' })
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setNameLocalizations({ 'es-ES': 'quitar' })
				.setDescription('Remove a warning from a user!')
				.setDescriptionLocalizations({ 'es-ES': 'Quita una advertencia de un usuario!' })
				.addUserOption(option => option.setName('user').setDescription('You can pass a mention or an id of a member.').setRequired(true))
				.addStringOption(option => option.setName('id').setDescription('You can provide the id of the warning you want to delete!'))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('show')
				.setDescription('Show all warnings of a user!')
				.addUserOption(option => option.setName('user').setDescription('You can pass a mention or an id of a member.').setRequired(true))
		);

	async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] });
			return;
		}

		const member = interaction.options.getMember('user') as GuildMember | null;

		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder("Couldn't find that member!")], ephemeral: true });
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'add':
				await addWarn(interaction);
				break;

			case 'remove':
				const id = interaction.options.getString('id');

				if (member.user.bot) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot remove a warning from a bot!')], ephemeral: true });
					return;
				}

				if (member.user.id === interaction.user.id) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot remove warnings yourself!')], ephemeral: true });
					return;
				}

				await interaction.deferReply({ ephemeral: true });

				try {
					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { mods: true, admins: true, logs: true },
					});

					const roles = interaction.member?.roles as GuildMemberRoleManager;

					if (!(roles.cache.has(guild?.mods!) || guild?.admins.includes(interaction.user.id) || interaction.user.id === interaction.guild?.ownerId)) {
						await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to remove warnings from members!")] });
						return;
					}

					const user = await prisma.user.findUnique({
						where: { user: member.user.id },
						select: { warns: true },
					});

					const warns = user?.warns;

					if (!warns?.length) {
						await interaction.editReply({ embeds: [errorEmbedBuilder("This user doesn't have any warnings")] });
						break;
					}

					if (!id) {
						const newWarns = warns.filter(warn => warn.guild !== member.guild.id);
						await prisma.user.update({
							where: { user: member.user.id },
							data: { warns: newWarns },
						});
						await interaction.editReply({ embeds: [successEmbedBuilder(`Removed all warnings from ${member.user}`)] });

						const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
						await logs?.send(
							logBuilder({
								member: interaction.member as GuildMember,
								content: `${interaction.user} has removed all warns of ${member.user}`,
								reason: `Warns removed by ${interaction.user.tag}`,
							})
						);
						break;
					}

					const newWarns = warns.filter(warn => warn.id !== id);
					if (JSON.stringify(warns) === JSON.stringify(newWarns)) {
						await interaction.editReply({ embeds: [errorEmbedBuilder(`Warning with id **${id}** has not been found!`)] });
						break;
					}
					await prisma.user.update({
						where: { user: member.user.id },
						data: { warns: newWarns },
					});
					await interaction.editReply({ embeds: [successEmbedBuilder(`Removed warning with id **${id}** from ${member.user}`)] });
					const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel;
					await logs?.send(
						logBuilder({
							member: interaction.member as GuildMember,
							content: `${interaction.user} has removed a warn from ${member.user}`,
							reason: `Warn removed by ${interaction.user.tag}`,
						})
					);
				} catch {
					await interaction.editReply(defaultError);
				}
				break;

			case 'show':
				if (member.user.bot) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot show warnings for a bot!')], ephemeral: true });
					return;
				}

				await interaction.deferReply({ ephemeral: true });

				try {
					const user = await prisma.user.findUnique({
						where: { user: member.user.id },
						select: { warns: true },
					});

					const warns = user?.warns?.filter(warn => warn.guild === interaction.guildId);

					const show = new EmbedBuilder({
						author: {
							name: interaction.guild?.name!,
							icon_url: interaction.guild?.iconURL()!,
						},
						title: `${emojis.warn} Warnings`,
						description:
							(warns?.length ?? 0) === 0
								? `${emojis.arrow} ${member.user} doesn't have any warnings!`
								: `> ${warns?.length === 1 ? `This is the warning` : `These are the ${warns?.length ?? 0} warnings`} that ${member.user} has!

`,
						fields: warns?.map((warn, i) => ({ name: `${i+1}. ${warn.id}`, value: `${emojis.arrow} ${warn.reason}` })),
						color: 0x2b2d31,
					});

					await interaction.editReply({ embeds: [show] });
				} catch {
					await interaction.editReply(defaultError);
				}
				break;
		}
	}
}
