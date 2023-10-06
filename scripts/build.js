import { build } from "esbuild";
import { readdirSync, statSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

await rm(join(process.cwd(), "dist"), { recursive: true, force: true });

const getAllFiles = (dir = process.cwd()) => {
	const files = readdirSync(dir);

	return files
		.map((file) => {
			if (
				file.includes("node_modules") ||
				file.includes(".git") ||
				file.includes("typings") ||
				file.includes("dist") ||
				file.includes("scripts")
			) {
				return;
			}

			if (statSync(join(dir, file)).isDirectory()) {
				return getAllFiles(join(dir, file));
			}

			if (file.endsWith(".ts") || file.endsWith(".js")) {
				return join(dir, file);
			}
		})
		.filter((file) => Boolean(file))
		.flat();
};

await build({
	entryPoints: getAllFiles(),
	logLevel: "warning",
	outdir: "./dist",
	outbase: ".",
	target: "node16",
	platform: "node",
	minify: true,
	tsconfig: join(process.cwd(), "tsconfig.json")
});

console.log("\x1b[32m  Project compiled successfully\x1b[0m");
