/** Small helper exposing backend package metadata without importing package.json deeply. */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { name: string; version: string };

export const packageInfo = { name: pkg.name, version: pkg.version };