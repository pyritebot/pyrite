"use strict";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import {
  loadImage,
  defaultError,
  errorEmbedBuilder,
  timeSince
} from "../utils.js";
import { join } from "node:path";
import prisma from "../database.js";
import qr from "qr-image";
export default class Info {
  data = new SlashCommandBuilder().setName("passport").setNameLocalizations({ "es-ES": "pasaporte" }).setDescription("A card with all important info of a user.").setDescriptionLocalizations({
    "es-ES": "Una tarjeta con toda la informacion importante de un usuario."
  }).addUserOption(
    (option) => option.setName("user").setNameLocalizations({ "es-ES": "usuario" }).setDescription("You can pass a mention or an id of a user.").setDescriptionLocalizations({
      "es-ES": "Puedes pasar una menci\xF3n o un id de un usuario"
    })
  );
  async run(interaction) {
    var _a, _b;
    const user = interaction.options.getUser("user") ?? interaction.user;
    if (user.bot) {
      await interaction.reply({
        embeds: [errorEmbedBuilder("You cannot get the passport of a Bot!")],
        ephemeral: true
      });
      return;
    }
    await interaction.deferReply();
    try {
      const avatarBuffer = await loadImage(user.displayAvatarURL());
      const roundedCorners = Buffer.from(`
				<svg>
					<rect x="0" y="0" width="128" height="128" rx="50%" ry="50%"/>
				</svg>
	 		`);
      const code = qr.imageSync(`https://discord.com/users/${user.id}`, {
        type: "png",
        size: 4,
        margin: 2
      });
      const toxicityUser = await prisma.user.findUnique({
        where: { user: user.id },
        select: {
          toxicity: true,
          warns: true
        }
      });
      const toxicity = (_a = toxicityUser == null ? void 0 : toxicityUser.toxicity) == null ? void 0 : _a.toFixed(2);
      const username = Buffer.from(`
				<svg width="625" height="400">
					<style>
		 				.name {
							font-size: 25px;							
			 				font-weight: bold;
			 				font-family: sans-serif;
							fill: #fff;
						}

	 					.opt {
			 				font-size: 16px;
							font-family: sans-serif;
			 				font-weight: bold;
			 				fill: #ededed;
						}
	 				</style>
		 	 		<text x="220" y="90" class="name">
						${user.username}
		 			</text>
					<text x="336" y="178" class="opt">
						${((toxicity == null ? void 0 : toxicity.endsWith("00")) ? toxicity == null ? void 0 : toxicity.slice(0, -3) : (toxicity == null ? void 0 : toxicity.endsWith("0")) ? toxicity == null ? void 0 : toxicity.slice(0, -1) : toxicity) ?? 0}%
		 			</text>
					<text x="362" y="156" class="opt">
						${((_b = toxicityUser == null ? void 0 : toxicityUser.warns) == null ? void 0 : _b.length) ?? 0}
		 			</text>
					<text x="423" y="134" class="opt">${timeSince(user.createdAt)}</text>
				</svg>
 			`);
      const avatarRoundedBuffer = await sharp(avatarBuffer).resize(128, 128).composite([
        {
          input: roundedCorners,
          blend: "dest-in"
        }
      ]).png().toBuffer();
      const image = await sharp(
        join(
          process.cwd(),
          user.id === "713745288619360306" ? "./assets/card-pinkblue.png" : "./assets/card-blue.png"
        )
      ).composite([
        {
          input: avatarRoundedBuffer,
          top: 60,
          left: 47
        },
        {
          input: code,
          top: 205,
          left: 363
        },
        { input: username }
      ]).png().toBuffer();
      await interaction.editReply({
        files: [new AttachmentBuilder(image, { name: "card.png" })]
      });
    } catch (e) {
      console.log(e);
      await interaction.editReply(defaultError);
    }
  }
}
//# sourceMappingURL=passport.js.map
