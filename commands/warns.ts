import type { CommandInteraction, Message, TextChannel } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder, Colors, PermissionFlagsBits } from "discord.js";
import { defaultError, errorEmbedBuilder, successEmbedBuilder, addWarn, logBuilder } from '../utils.js'
import prisma from '../database.js'

export default class Warns {
	data = new SlashCommandBuilder()
		.setName('warns')
		.setDescription('Use this command to manage the warnings in your server!')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a warning to a user!')
				.addUserOption(option =>
					option.setName('member').setDescription('You can pass a mention or an id of a member.').setRequired(true)
				)
				.addStringOption(option =>
					option.setName('reason').setDescription('You must provide a reason for this warning').setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Remove a warning from a user!')
				.addUserOption(option =>
					option.setName('member').setDescription('You can pass a mention or an id of a member.').setRequired(true)
				)
				.addStringOption(option =>
					option.setName('id').setDescription('You must provide the id of the warning you want to delete!')
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('show')
				.setDescription('Show all warnings of a user!')
				.addUserOption(option =>
					option.setName('member').setDescription('You can pass a mention or an id of a member.').setRequired(true)
				)
		)

	async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
			return
		}
		
		const member = interaction.options.getMember('member') as Message | null

		if (!member) {
			await interaction.reply({ embeds: [errorEmbedBuilder("Couldn't find that member!")], ephemeral: true })
			return;
		}
		
		switch (interaction.options.getSubcommand()) {
			case 'add':
				await addWarn(interaction)
				break;

			case 'remove':
				const id = interaction.options.getString('id')
			
				if (member.user.bot) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot remove a warning from a bot!')], ephemeral: true })
					return;
				}
					
				if (member.user.id === interaction.user.id) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot remove warnings yourself!')], ephemeral: true })
					return;
				}
					
				await interaction.deferReply({ ephemeral: true })
					
				try {
					const guild = await prisma.guild.findUnique({
						where: { guild: interaction.guildId! },
						select: { mods: true, admins: true, logs: true },
					})

					if (!(interaction.member?.roles.cache.has(guild?.mods) || guild?.admins.includes(interaction.user.id) || interaction.user.id === interaction.guild?.ownerId)) {
						await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have permission to remove warnings from members!")] })
						return;
					}

					const user = await prisma.user.findUnique({
						where: { user: member.user.id },
						select: { warns: true },
					})

					const warns = user?.warns

					if (!warns?.length) {
						await interaction.editReply({ embeds: [errorEmbedBuilder("This user doesn't have any warnings")] })
						break;
					}
					
					if (!id) {
						const newWarns = warns.filter(warn => warn.guild !== member.guild.id)
						await prisma.user.update({
							where: { user: member.user.id },
							data: { warns: newWarns },
						})
						await interaction.editReply({ embeds: [successEmbedBuilder(`Removed all warnings from ${member.user}`)] })
					
						const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel
						await logs?.send(
							logBuilder({
								member: interaction.member as Message,
								content: `${interaction.user} has removed all warns of ${member.user}`,
								reason: `Warns removed by ${interaction.user.tag}`,
							})
						)
						break;
					}

					const newWarns = warns.filter(warn => warn.id !== id)
					if (JSON.stringify(warns) === JSON.stringify(newWarns)) {
						await interaction.editReply({ embeds: [errorEmbedBuilder(`Warning with id **${id}** has not been found!`)] })
						break;
					}
					await prisma.user.update({
						where: { user: member.user.id },
						data: { warns: newWarns }
					})
					await interaction.editReply({ embeds: [successEmbedBuilder(`Removed warning with id **${id}** from ${member.user}`)] })
					const logs = interaction.guild?.channels.cache.get(guild?.logs!) as TextChannel
					await logs?.send(
						logBuilder({
							member: interaction.member as Message,
							content: `${interaction.user} has removed a warn from ${member.user}`,
							reason: `Warn removed by ${interaction.user.tag}`,
						})
					)
				} catch {
					await interaction.editReply(defaultError)
				}
				break;

			case 'show':
				if (member.user.bot) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot show warnings for a bot!')], ephemeral: true })
					return;
				}
				
				await interaction.deferReply({ ephemeral: true })
				
				try {
					const user = await prisma.user.findUnique({
						where: { user: member.user.id },
						select: { warns: true },
					})
	
					const warns = user?.warns?.filter(warn => warn.guild === interaction.guildId)
					
          const show = new EmbedBuilder({
            author: {
              name: interaction.guild?.name!,
              icon_url: interaction.guild?.iconURL()!,
            },
            title: '<:warn:1009191992040894657> Warnings',
            description: (warns?.length ?? 0) === 0 
							? `> ${member.user} doesn't have any warnings!`
							: `> ${warns?.length === 1 ? `This is the warning` : `These are the ${warns?.length ?? 0} warnings`} that ${member.user} has!`,
						fields: warns?.map(warn => ({ name: warn.id, value: `<:blank:1008721958210383902> <:arrow:1009057573590290452> ${warn.reason}` })),
						color: Colors.Blurple
          })

					await interaction.editReply({ embeds: [show] })
				} catch {
					await interaction.editReply(defaultError)
				}
				break;
		}
	}
}