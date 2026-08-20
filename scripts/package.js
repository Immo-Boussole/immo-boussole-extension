import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

console.log('Packaging Immo-Boussole WebExtension...');

// Ensure dist builds exist
execSync('npm run build:firefox', { stdio: 'inherit' });
execSync('npm run build:chrome', { stdio: 'inherit' });

console.log('Build completed successfully.');
