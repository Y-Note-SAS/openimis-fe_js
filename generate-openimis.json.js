const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Récupérer le chemin du module courant passé en paramètre (module-path)
const modulePath = process.env.MODULE_PATH || './current-module';
const moduleFullPath = path.resolve(modulePath);

// Fichier module-config.json dans le module courant
const moduleConfigFile = path.join(moduleFullPath, 'module-config.json');

// Lire le module-config.json
if (!fs.existsSync(moduleConfigFile)) {
    console.error(`Fichier module-config.json non trouvé dans ${moduleFullPath}`);
    process.exit(1);
}

const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigFile, 'utf-8'));

// Récupérer la branche actuelle si non définie
if (!moduleConfig.branch) {
    try {
        const branch = execSync(`git -C ${moduleFullPath} rev-parse --abbrev-ref HEAD`).toString().trim();
        moduleConfig.branch = branch;
    } catch (e) {
        console.warn('Impossible de récupérer la branche actuelle, utilisation de develop');
        moduleConfig.branch = 'develop';
    }
}

// Récupérer le remote si non défini
if (!moduleConfig.repo) {
    try {
        const remote = execSync(`git -C ${moduleFullPath} config --get remote.origin.url`).toString().trim();
        moduleConfig.repo = remote.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
    } catch (e) {
        console.warn('Impossible de récupérer le remote, utilisation openimis/openimis-fe-'+moduleConfig.moduleName+'_js');
        moduleConfig.repo = `openimis/openimis-fe-${moduleConfig.moduleName}_js`;
    }
}

// Construire la liste des modules à inclure
const modulesToInclude = [];

// Dépendances du module courant
if (moduleConfig.dependencies && Array.isArray(moduleConfig.dependencies)) {
    moduleConfig.dependencies.forEach(dep => {
        modulesToInclude.push({
            name: dep.charAt(0).toUpperCase() + dep.slice(1) + "Module",
            npm: `@openimis/fe-${dep}@https://github.com/openimis/openimis-fe-${dep}_js#develop`
        });
    });
}

// Ajouter le module courant
modulesToInclude.push({
    name: moduleConfig.moduleName.charAt(0).toUpperCase() + moduleConfig.moduleName.slice(1) + "Module",
    npm: `@openimis/${moduleConfig.moduleName}@https://github.com/${moduleConfig.repo}#${moduleConfig.branch}`
});

// Lire ou créer openimis.json
const openimisJsonPath = path.join(__dirname, 'openimis.json');
let feConfig = { locales: [], modules: [] };
if (fs.existsSync(openimisJsonPath)) {
    feConfig = JSON.parse(fs.readFileSync(openimisJsonPath, 'utf-8'));
}

// Remplacer uniquement les modules
feConfig.modules = modulesToInclude;

// Sauvegarder openimis.json
fs.writeFileSync(openimisJsonPath, JSON.stringify(feConfig, null, 4), 'utf-8');
console.log(`openimis.json mis à jour pour ${moduleConfig.moduleName}`);
