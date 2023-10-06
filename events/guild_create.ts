import { EmbedBuilder, Events, type Guild } from "discord.js";
import { buttons, emojis, setActivity } from "../utils.js";

export default class {
	name = Events.GuildCreate;

	async run(guild: Guild) {
		setActivity(guild.client);
		const embed = new EmbedBuilder()
			.setTitle(`${emojis.list} Welcome to Pyrite Bot`)
			.setDescription(`${emojis.reply1} Thank you for choosing **Pyrite Bot**, I will make sure to try my best to protect your server from raider's, spammer's and so much more.
        
You can configure me on the dashboard below this message. Need more servers protected? Add me to any server you think needs protection!
        `)
			.setColor(0x2b2d31);

		const owner = await guild.fetchOwner();
		await owner
			.send({
				embeds: [embed],
				components: [buttons],
			})
			.catch(() => {});
	}
}
