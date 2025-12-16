const fs = require('fs');
const path = require('path');

const modulePath = process.env.MODULE_PATH || './current-module';
const moduleFullPath = path.resolve(modulePath);

const moduleConfigFile = path.join(moduleFullPath, 'module-config.json');

if (!fs.existsSync(moduleConfigFile)) {
    console.error(`File module-config.json not found ${moduleFullPath}`);
    process.exit(1);
}

const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigFile, 'utf-8'));

const modulesToInclude = [];

if (moduleConfig.dependencies && Array.isArray(moduleConfig.dependencies)) {
    moduleConfig.dependencies.forEach(dep => {
        modulesToInclude.push({
            name: formatModuleName(dep),
            npm: `@openimis/fe-${dep}@https://github.com/openimis/openimis-fe-${dep}_js#develop`
        });
    });
}

const openimisJsonPath = path.join(__dirname, 'openimis.json');
let feConfig = { locales: [], modules: [] };
if (fs.existsSync(openimisJsonPath)) {
    feConfig = JSON.parse(fs.readFileSync(openimisJsonPath, 'utf-8'));
}

feConfig.modules = modulesToInclude;

fs.writeFileSync(openimisJsonPath, JSON.stringify(feConfig, null, 4), 'utf-8');

function formatModuleName(dep) {
    const parts = dep.split(/[-_]/);
    const capitalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
    return capitalized.join('') + 'Module';
}

