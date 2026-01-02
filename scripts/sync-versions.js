#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const version = process.argv[2];

if (!version) {
  console.error("Usage: node sync-versions.js <version>");
  process.exit(1);
}

console.log(`Syncing version to ${version}`);

// Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(__dirname, "../src-tauri/tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
console.log(`Updated ${tauriConfPath}`);

// Update src-tauri/Cargo.toml
const cargoPath = path.join(__dirname, "../src-tauri/Cargo.toml");
let cargoContent = fs.readFileSync(cargoPath, "utf8");
cargoContent = cargoContent.replace(
  /^version = ".*"$/m,
  `version = "${version}"`,
);
fs.writeFileSync(cargoPath, cargoContent);
console.log(`Updated ${cargoPath}`);

console.log("Version sync complete!");
