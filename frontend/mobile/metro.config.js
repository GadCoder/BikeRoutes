const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Ensure Metro watches the entire monorepo (shared workspace, root node_modules, etc.)
config.watchFolders = [monorepoRoot];

// Resolve modules: local workspace node_modules first, then hoisted root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Prevent Metro from looking beyond the monorepo root
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
