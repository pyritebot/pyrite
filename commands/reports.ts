import type { CommandInteraction, TextChannel } from "discord.js";
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder, Colors } from 'discord.js';
import { addReport, defaultError, errorEmbedBuilder, successEmbedBuilder } from "../utils.js";
import prisma from '../database.js'

export default class Report {
  data = new SlashCommandBuilder()
    .setName('reports')
    .setDescription('Report to spread awareness of potentially toxic users and scammers')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a report for a user')
        .addUserOption(option => option.setName('user').setDescription('The user you want to report').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Why do you want to report this user?').setRequired(true))
        .addAttachmentOption(option => option.setName('image').setDescription('To approve this report, we need image proof.').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a report for a user')
				.addStringOption(option => option.setName('id').setDescription('The id of the report you want taken down.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Why do you want to remove this report?').setRequired(true))
        .addAttachmentOption(option => option.setName('image').setDescription('To approve this report, we need image proof.').setRequired(true))
    )
		.addSubcommand(subcommand => 
			subcommand
				.setName('show')
				.setDescription('Show all reports of a user!')
				.addUserOption(option => option.setName('user').setDescription('The mention or user id of the user you want to see reports from'))
		)

  async run(interaction: CommandInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ embeds: [errorEmbedBuilder('This command can only be run on a server!')] })
      return
    }

    switch (interaction.options.getSubcommand()) {
      case 'add':
        await addReport(interaction)

      case 'remove':
        const id = interaction.options.getString('id')
				const reason = interaction.options.getString('reason')
				const file = interaction.options.getAttachment('image')

        if (interaction.user.bot) {
          await interaction.reply({ embeds: [errorEmbedBuilder('You cannot remove a reporting from a bot!')], ephemeral: true })
          return;
        }

        await interaction.deferReply({ ephemeral: true })

        try {
          const guild = await prisma.guild.findUnique({
            where: { guild: interaction.guildId! },
            select: { mods: true, admins: true, logs: true },
          })

          const user = await prisma.user.findUnique({
            where: { user: interaction.user.id },
            select: { reports: true },
          })

          const reports = user?.reports

          if (!reports?.length) {
            await interaction.editReply({ embeds: [errorEmbedBuilder("You don't have any reports")] })
            break;
          }

          const newReports = reports.filter(report => report.id !== id)
          if (JSON.stringify(reports) === JSON.stringify(newReports)) {
            await interaction.editReply({ embeds: [errorEmbedBuilder(`Report with id **${id}** has not been found!`)] })
            break;
          }
					
          const reportSubmittedEmbed = new EmbedBuilder({
            title: '<:check:1008718056891101194> Report Submitted',
            description: `Your report was submitted and our staff team will be looking into it.
Thank you for submitting this report. For more updates please join our support server below. Please also keep your DMS on so we can easly send you feedback.`,
            color: Colors.Blurple
          })
          await interaction.editReply({ embeds: [reportSubmittedEmbed] })

          const channel = interaction.client.channels.cache.get('1022909267440828466') as TextChannel

          await channel?.send({
            embeds: [
              new EmbedBuilder({
                color: Colors.Blurple,
                title: '<:arrow:1009057573590290452> New Report!',
                description: `<:1412reply:1009087336828649533>*New report for ${interaction.user}* \n\n **Reason:** ${reason}`,
                image: {
                  url: 'attachment://report.png'
                }
              })
            ],
            files: [new AttachmentBuilder(file?.url, { name: 'report.png' })],
            components: [
              new ActionRowBuilder<ButtonBuilder>({
                components: [
                  new ButtonBuilder({
                    custom_id: `unreport_approve-${id}-${interaction.user.id}`,
                    label: 'Remove Report',
                    style: ButtonStyle.Success
                  }),
                  new ButtonBuilder({
                    custom_id: `report_reject`,
                    label: 'Ignore',
                    style: ButtonStyle.Danger
                  })
                ]
              })
            ]
          })
        } catch {
          await interaction.editReply(defaultError)
        }
        break;

			case 'show':
				const member = interaction.options.getMember('user') ?? interaction.member
				
				if (member?.user.bot) {
					await interaction.reply({ embeds: [errorEmbedBuilder('You cannot show reportings for a bot!')], ephemeral: true })
					return;
				}
				
				await interaction.deferReply({ ephemeral: true })
				
				try {
					const user = await prisma.user.findUnique({
						where: { user: member?.user.id },
						select: { reports: true },
					})
	
					const reports = user?.reports
					
          const show = new EmbedBuilder({
            author: {
              name: interaction.guild?.name!,
              icon_url: interaction.guild?.iconURL()!,
            },
            title: '<:report:1009191992040894657> Reports',
            description: (reports?.length ?? 0) === 0 
							? `> ${member?.user} doesn't have any reports!`
							: `> ${reports?.length === 1 ? `This is the report` : `These are the ${reports?.length ?? 0} reports`} that ${member.user} has!`,
						fields: reports?.map(report => ({ name: report.id, value: `<:blank:1008721958210383902> <:arrow:1009057573590290452> ${report.reason}` })),
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