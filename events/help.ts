import type { Interaction } from 'discord.js'
import { Events, EmbedBuilder } from 'discord.js'
import emojis from '../emojis.js'

export default class Help {
	name = Events.InteractionCreate

	async run(interaction: Interaction) {
		if (!interaction.isStringSelectMenu()) return;
		if (interaction.customId !== 'help_select') return;
	
		const helpEmbed = new EmbedBuilder({ color: 0x2b2d31 });
	
		switch (interaction.values[0]) {
			case 'start':
				helpEmbed
					.setTitle(`${emojis.list}  Help`)
					.setDescription(`
Thanks for choosing Pyrite Bot, the future of Discord server security! 

I'm gonna help you keep your server safe from any threats that try ruin your community. 

${emojis.blank}${emojis.arrow} To fully set me up it is recommended looking at the categories below.

Click on __**Select Category**__ below to get started. 
<:blank:1008721958210383902> <:arrow:1068604670764916876> If you got any doubts join us in our [Support Server](https://discord.gg/NxJzWWqhdQ) \:)
`,
					)
				break;
	
			case 'moderation':
				helpEmbed.setTitle('<:moderator:1008717826552504321> Moderation').setDescription("> Here's a list of the moderation commands").setFields(
					{
						name: '</warns add:1014153355377004669>',
						value: `${emojis.blank}${emojis.arrow} Warn a server member`,
					},
					{
						name: '</warns show:1014153355377004669>',
						value: `${emojis.blank}${emojis.arrow} Show the amount of warnings a user has`,
					},
					{
						name: '</warns remove:1014153355377004669>',
						value: `${emojis.blank}${emojis.arrow} Remove a user's warns`,
					},
					{
						name: '</warn:1014153355377004668>',
						value: `${emojis.blank}${emojis.arrow} Warn a server member (alias to </warns add:1014153355377004669>)`,
            
					},
					{
						name: '</timeout add:1022876978589749298>',
						value: `${emojis.blank}${emojis.arrow} Timeout a user.`,
					},
					{
						name: '</timeout remove:1022876978589749298>',
						value: `${emojis.blank}${emojis.arrow} Remove the timeout from a user`,
					},
					{
						name: '</clear:1014153355330850850>',
						value: `${emojis.blank}${emojis.arrow} Clear a certain amount of messages in a channel`,
					},
					{
						name: '</kick:1014153355330850854>',
						value: `${emojis.blank}${emojis.arrow} Kick a certain member`,
					},
					{
						name: '</ban:1014153355330850849>',
						value: `${emojis.blank}${emojis.arrow} Ban a certain member`,
					},
	        {
						name: '</modnick:1027275060131672114>',
						value: `${emojis.blank}${emojis.arrow} Change a users name to a pingable one`,
					},
					{ 
						name: '</logs on:1022226973386362962>', 
						value: `${emojis.blank}${emojis.arrow} Set the mod log channel`,  
					},
					{ 
						name: '</logs off:1022226973386362962>', 
						value: `${emojis.blank}${emojis.arrow} Turn off mod logs`,  
					}
				);
				break;
	
			case 'verification':
				helpEmbed
					.setTitle('<:check:1027354811164786739> Verification')
					.setDescription("> Here's a list of the verification commands")
					.setFields(
						{ name: '</verification on:1014153355377004667>', value: `${emojis.blank}${emojis.arrow} Turn on verification` },
						{ name: '</verification off:1014153355377004667>', value: `${emojis.blank}${emojis.arrow} Turn off verification` },
						{ name: '</verification role:1014153355377004667>', value: `${emojis.blank}${emojis.arrow} Set the role to be assigned once verified` },
						{ name: '</verification removerole:1014153355377004667>', value: `${emojis.blank}${emojis.arrow} Remove the verification role` },
					)
				break;
	
			case 'whitelisting':
				helpEmbed.setTitle('<:staff:1008719693827285002> Whitelisting').setDescription("> Here's a list of the whitelist commands").setFields(
					{ name: '</whitelist mod:1014153355377004670>', value: `${emojis.blank}${emojis.arrow} Set the mod role whitelist. \n` },
					{ name: '</whitelist admin:1014153355377004670>', value: `${emojis.blank}${emojis.arrow} Set the admin role whitelist. \n` },
					{ name: '</whitelist show:1014153355377004670>', value: `${emojis.blank}${emojis.arrow} Show all whitelisted roles \n` },
					{
						name: '</whitelist owner:1014153355377004670>',
						value: `${emojis.blank}${emojis.arrow} Add a user to the owner whitelist`,
					},
					{ name: '</whitelist remove:1014153355377004670>', value: `${emojis.blank}${emojis.arrow} Remove a whitelisted role` }
				);
				break;
	
			case 'antiraid':
				helpEmbed.setTitle('<:ban:1020333545887113246> Anti Raid').setDescription("> Here's a list of the anti raid commands").setFields(
					{
						name: '</antiraid on:1022139621993365534>',
						value: `${emojis.blank}${emojis.arrow} Turn on **Pyrite**'s anti raid system to keep your server safe`,
					},
					{ name: '</antiraid off:1022139621993365534>', value: `${emojis.blank}${emojis.arrow} Turn off the anti raid system` },
					{
						name: '</lockdown on:1014153355330850855>',
						value:
							`${emojis.blank}${emojis.arrow} __Only use this if theres a big raid.__ **Pyrite** will fully lockdown the entire server and make sure there's not a raid`,
					},
					{ name: '</lockdown off:1014153355330850855>', value: `${emojis.blank}${emojis.arrow} __Use this to disable the lockdown__` },
					{
						name: '</lockdown update:1014153355330850855>',
						value: `${emojis.blank}${emojis.arrow} Post updates during your server lockdown for members to see.`,
					}
				);
				break;
	
			case 'automod':
				helpEmbed.setTitle('<:muted:1010127791070658570> Automod').setDescription("> Here's a list of the automod commands").setFields(
					{ name: '</antispam on:1014153355330850847>', value: `${emojis.blank}${emojis.arrow} Turn on anti spam so no one can spam.` },
					{ name: '</antispam off:1014153355330850847>', value: `${emojis.blank}${emojis.arrow} Turn on off anti spam.` },
					{
						name: '</antispam set:1014153355330850847>',
						value:
							`${emojis.blank}${emojis.arrow} Set the different limits of the antispam filter.`,
					},
					{ name: '</antitoxicity on:1014153355330850848>', value: `${emojis.blank}${emojis.arrow} Turn on anti toxicity in your server.` },
					{
						name: '</antitoxicity off:1014153355330850848>',
						value: `${emojis.blank}${emojis.arrow} Turn off anti toxicity in your server.`,
					},
					{
						name: '</antilinks on:1020737736598093852>',
						value: `${emojis.blank}${emojis.arrow} Turn on anti server links in your server.`,
					},
					{
						name: '</antilinks off:1020737736598093852>',
						value: `${emojis.blank}${emojis.arrow} Turn off anti server links in your server.`,
					},
					{
						name: '</antialts on:1024048700865126430>',
						value: `${emojis.blank}${emojis.arrow} Turn on the anti alts system to keep alt accounts out of your server.`,
					},
					{ name: '</antialts off:1024048700865126430>', 
	          value: `${emojis.blank}${emojis.arrow} Turn off the anti alts system.` 
	        },
				);
				break;
		}
		
		await interaction.update({ embeds: [helpEmbed] });
	}
}