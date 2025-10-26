#!/usr/bin/env node

/**
 * Script de Consolidación de Configuraciones - TechNovaStore
 * 
 * Este script aplica las correcciones identificadas en el análisis:
 * 1. Estandariza versiones de dependencias
 * 2. Consolida variables de entorno
 * 3. Crea configuraciones centralizadas
 */

const fs = require('fs');
const path = require('path');

class ConfigurationConsolidator {
    constructor() {
        this.standardVersions = {
            // Dependencias principales
            'typescript': '^5.3.3',
            'express': '^4.18.2',
            '@types/express': '^4.17.21',
            '@types/node': '^20.10.0',
            'nodemon': '^3.0.2',
            'ts-node': '^10.9.2',
            'jest': '^29.7.0',
            '@types/jest': '^29.5.12',
            'cors': '^2.8.5',
            'helmet': '^7.1.0',
            'axios': '^1.6.2',
            '@types/cors': '^2.8.17',
            'pg': '^8.11.3',
            'sequelize': '^6.37.7',
            '@types/pg': '^8.10.9',
            'winston': '^3.11.0',
            'ts-jest': '^29.1.2',
            'mongoose': '^8.0.3',
            'redis': '^4.6.12',
            'joi': '^17.11.0',
            'express-validator': '^7.0.1',
            'morgan': '^1.10.0',
            '@types/morgan': '^1.9.9',
            'uuid': '^9.0.1',
            '@types/uuid': '^9.0.7',
            'dotenv': '^16.3.1',
            'bcrypt': '^5.1.1',
            '@types/bcrypt': '^5.0.2',
            'jsonwebtoken': '^9.0.2',
            '@types/jsonwebtoken': '^9.0.5',
            'nodemailer': '^7.0.9',
            '@types/nodemailer': '^6.4.15'
        };

        this.standardEnvVars = {
            // Variables de base de datos
            'POSTGRES_HOST': 'localhost',
            'POSTGRES_PORT': '5432',
            'POSTGRES_DB': 'technovastore',
            'POSTGRES_USER': 'technovastore_user',
            'POSTGRES_PASSWORD': 'your_secure_postgres_password',
            
            // Variables de Redis
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_PASSWORD': 'your_secure_redis_password',
            'REDIS_DB': '0',
            
            // Variables de MongoDB
            'MONGODB_URI': 'mongodb://localhost:27017/technovastore',
            
            // Variables de autenticación
            'JWT_SECRET': 'your_super_secure_jwt_secret_key_minimum_32_characters',
            
            // Variables de email
            'SMTP_HOST': 'smtp.gmail.com',
            'SMTP_PORT': '587',
            'SMTP_USER': 'noreply@technovastore.com',
            'SMTP_PASS': 'your_smtp_app_password',
            
            // Variables de aplicación
            'NODE_ENV': 'development',
            'LOG_LEVEL': 'info',
            'FRONTEND_URL': 'http://localhost:3011',
            'API_BASE_URL': 'http://localhost:3000',
            
            // Variables de seguridad
            'CORS_ORIGIN': 'http://localhost:3011',
            'RATE_LIMIT_WINDOW_MS': '900000',
            'RATE_LIMIT_MAX_REQUESTS': '100',
            
            // Variables de cache
            'CACHE_TTL': '3600',
            
            // Variables de APIs externas (vacías por defecto)
            'AMAZON_API_KEY': '',
            'AMAZON_SECRET_KEY': '',
            'ALIEXPRESS_API_KEY': '',
            'BANGGOOD_API_KEY': '',
            'EBAY_API_KEY': '',
            'NEWEGG_API_KEY': ''
        };

        this.changes = [];
    }

    // Actualizar versiones de dependencias en package.json
    updatePackageVersions() {
        console.log('🔧 Actualizando versiones de dependencias...\n');
        
        const packageFiles = this.findPackageFiles();
        
        for (const packageFile of packageFiles) {
            try {
                const content = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                let hasChanges = false;
                
                // Actualizar dependencies
                if (content.dependencies) {
                    hasChanges = this.updateDependencyVersions(content.dependencies, packageFile, 'dependencies') || hasChanges;
                }
                
                // Actualizar devDependencies
                if (content.devDependencies) {
                    hasChanges = this.updateDependencyVersions(content.devDependencies, packageFile, 'devDependencies') || hasChanges;
                }
                
                if (hasChanges) {
                    fs.writeFileSync(packageFile, JSON.stringify(content, null, 2) + '\n');
                    console.log(`✅ Actualizado: ${packageFile}`);
                }
                
            } catch (error) {
                console.error(`❌ Error actualizando ${packageFile}: ${error.message}`);
            }
        }
    }

    updateDependencyVersions(dependencies, packageFile, type) {
        let hasChanges = false;
        
        for (const [depName, currentVersion] of Object.entries(dependencies)) {
            if (this.standardVersions[depName] && this.standardVersions[depName] !== currentVersion) {
                const oldVersion = currentVersion;
                dependencies[depName] = this.standardVersions[depName];
                
                this.changes.push({
                    type: 'dependency',
                    file: packageFile,
                    dependency: depName,
                    section: type,
                    oldVersion,
                    newVersion: this.standardVersions[depName]
                });
                
                hasChanges = true;
            }
        }
        
        return hasChanges;
    }

    // Consolidar variables de entorno
    consolidateEnvironmentVariables() {
        console.log('\n🔧 Consolidando variables de entorno...\n');
        
        const envFiles = this.findEnvFiles();
        
        for (const envFile of envFiles) {
            try {
                let content = fs.readFileSync(envFile, 'utf8');
                let hasChanges = false;
                
                // Procesar línea por línea
                const lines = content.split('\n');
                const newLines = [];
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    
                    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                        const [key, ...valueParts] = trimmed.split('=');
                        const currentValue = valueParts.join('=');
                        
                        if (this.standardEnvVars[key] && this.shouldUpdateEnvVar(envFile, key, currentValue)) {
                            const newValue = this.getStandardEnvValue(envFile, key);
                            newLines.push(`${key}=${newValue}`);
                            
                            this.changes.push({
                                type: 'environment',
                                file: envFile,
                                variable: key,
                                oldValue: currentValue,
                                newValue: newValue
                            });
                            
                            hasChanges = true;
                        } else {
                            newLines.push(line);
                        }
                    } else {
                        newLines.push(line);
                    }
                }
                
                if (hasChanges) {
                    fs.writeFileSync(envFile, newLines.join('\n'));
                    console.log(`✅ Actualizado: ${envFile}`);
                }
                
            } catch (error) {
                console.error(`❌ Error actualizando ${envFile}: ${error.message}`);
            }
        }
    }

    shouldUpdateEnvVar(envFile, key, currentValue) {
        // No actualizar si es un archivo de producción/staging con valores específicos
        if (envFile.includes('.prod.') || envFile.includes('.staging.')) {
            return false;
        }
        
        // No actualizar si el valor actual parece ser un valor real (no placeholder)
        const placeholderPatterns = [
            /^your[-_]/i,
            /^change[-_]/i,
            /^replace[-_]/i,
            /password$/i,
            /secret$/i,
            /key$/i
        ];
        
        const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(currentValue));
        
        return isPlaceholder || currentValue === '' || currentValue === this.standardEnvVars[key];
    }

    getStandardEnvValue(envFile, key) {
        // Ajustar valores según el tipo de archivo
        if (envFile.includes('frontend')) {
            if (key === 'FRONTEND_URL') return 'http://localhost:3001';
            if (key === 'API_BASE_URL') return 'http://localhost:3000/api';
        }
        
        if (envFile.includes('notification')) {
            if (key === 'PORT') return '3005';
        }
        
        if (envFile.includes('chatbot')) {
            if (key === 'PORT') return '3001';
            if (key === 'FRONTEND_URL') return 'http://localhost:3000';
            if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
        }
        
        if (envFile.includes('shipment-tracker')) {
            if (key === 'PORT') return '3006';
        }
        
        return this.standardEnvVars[key];
    }

    // Crear archivo de configuración centralizada
    createCentralizedConfig() {
        console.log('\n🔧 Creando configuración centralizada...\n');
        
        const centralConfig = {
            dependencies: {
                common: {
                    runtime: {
                        'express': this.standardVersions['express'],
                        'cors': this.standardVersions['cors'],
                        'helmet': this.standardVersions['helmet'],
                        'morgan': this.standardVersions['morgan'],
                        'winston': this.standardVersions['winston'],
                        'dotenv': this.standardVersions['dotenv']
                    },
                    database: {
                        'pg': this.standardVersions['pg'],
                        'sequelize': this.standardVersions['sequelize'],
                        'mongoose': this.standardVersions['mongoose'],
                        'redis': this.standardVersions['redis']
                    },
                    validation: {
                        'joi': this.standardVersions['joi'],
                        'express-validator': this.standardVersions['express-validator']
                    },
                    auth: {
                        'bcrypt': this.standardVersions['bcrypt'],
                        'jsonwebtoken': this.standardVersions['jsonwebtoken']
                    },
                    utils: {
                        'axios': this.standardVersions['axios'],
                        'uuid': this.standardVersions['uuid'],
                        'nodemailer': this.standardVersions['nodemailer']
                    }
                },
                development: {
                    'typescript': this.standardVersions['typescript'],
                    'ts-node': this.standardVersions['ts-node'],
                    'nodemon': this.standardVersions['nodemon'],
                    '@types/node': this.standardVersions['@types/node'],
                    '@types/express': this.standardVersions['@types/express'],
                    '@types/cors': this.standardVersions['@types/cors'],
                    '@types/morgan': this.standardVersions['@types/morgan'],
                    '@types/pg': this.standardVersions['@types/pg'],
                    '@types/bcrypt': this.standardVersions['@types/bcrypt'],
                    '@types/jsonwebtoken': this.standardVersions['@types/jsonwebtoken'],
                    '@types/uuid': this.standardVersions['@types/uuid'],
                    '@types/nodemailer': this.standardVersions['@types/nodemailer']
                },
                testing: {
                    'jest': this.standardVersions['jest'],
                    '@types/jest': this.standardVersions['@types/jest'],
                    'ts-jest': this.standardVersions['ts-jest']
                }
            },
            environment: {
                development: this.standardEnvVars,
                common: {
                    database: {
                        'POSTGRES_HOST': 'localhost',
                        'POSTGRES_PORT': '5432',
                        'POSTGRES_DB': 'technovastore',
                        'MONGODB_URI': 'mongodb://localhost:27017/technovastore',
                        'REDIS_HOST': 'localhost',
                        'REDIS_PORT': '6379',
                        'REDIS_DB': '0'
                    },
                    security: {
                        'CORS_ORIGIN': 'http://localhost:3011',
                        'RATE_LIMIT_WINDOW_MS': '900000',
                        'RATE_LIMIT_MAX_REQUESTS': '100'
                    },
                    email: {
                        'SMTP_HOST': 'smtp.gmail.com',
                        'SMTP_PORT': '587'
                    }
                }
            }
        };
        
        const configPath = 'shared/config/standard-versions.json';
        fs.writeFileSync(configPath, JSON.stringify(centralConfig, null, 2));
        console.log(`✅ Configuración centralizada creada: ${configPath}`);
    }

    // Generar documentación de cambios
    generateChangeLog() {
        console.log('\n📄 Generando log de cambios...\n');
        
        const changeLog = {
            timestamp: new Date().toISOString(),
            summary: {
                totalChanges: this.changes.length,
                dependencyChanges: this.changes.filter(c => c.type === 'dependency').length,
                environmentChanges: this.changes.filter(c => c.type === 'environment').length
            },
            changes: this.changes
        };
        
        const logPath = 'consolidation-changes.json';
        fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2));
        
        // Generar resumen legible
        const summaryLines = [
            '# Resumen de Consolidación de Configuraciones',
            '',
            `**Fecha:** ${new Date().toLocaleString()}`,
            `**Total de cambios:** ${this.changes.length}`,
            '',
            '## Cambios en Dependencias',
            ''
        ];
        
        const depChanges = this.changes.filter(c => c.type === 'dependency');
        const depByPackage = {};
        
        for (const change of depChanges) {
            if (!depByPackage[change.file]) {
                depByPackage[change.file] = [];
            }
            depByPackage[change.file].push(change);
        }
        
        for (const [packageFile, changes] of Object.entries(depByPackage)) {
            summaryLines.push(`### ${packageFile}`);
            for (const change of changes) {
                summaryLines.push(`- ${change.dependency}: ${change.oldVersion} → ${change.newVersion}`);
            }
            summaryLines.push('');
        }
        
        summaryLines.push('## Cambios en Variables de Entorno', '');
        
        const envChanges = this.changes.filter(c => c.type === 'environment');
        const envByFile = {};
        
        for (const change of envChanges) {
            if (!envByFile[change.file]) {
                envByFile[change.file] = [];
            }
            envByFile[change.file].push(change);
        }
        
        for (const [envFile, changes] of Object.entries(envByFile)) {
            summaryLines.push(`### ${envFile}`);
            for (const change of changes) {
                summaryLines.push(`- ${change.variable}: \`${change.oldValue}\` → \`${change.newValue}\``);
            }
            summaryLines.push('');
        }
        
        const summaryPath = 'CONSOLIDATION-SUMMARY.md';
        fs.writeFileSync(summaryPath, summaryLines.join('\n'));
        
        console.log(`✅ Log de cambios guardado: ${logPath}`);
        console.log(`✅ Resumen generado: ${summaryPath}`);
        
        return changeLog;
    }

    // Métodos auxiliares
    findPackageFiles(dir = '.', exclude = ['node_modules', 'dist', '.git']) {
        const files = [];
        
        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !exclude.includes(item)) {
                    scan(fullPath);
                } else if (item === 'package.json') {
                    files.push(fullPath);
                }
            }
        };
        
        scan(dir);
        return files;
    }

    findEnvFiles(dir = '.', exclude = ['node_modules', 'dist', '.git']) {
        const files = [];
        
        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !exclude.includes(item)) {
                    scan(fullPath);
                } else if (item.includes('.env') && item.includes('example')) {
                    files.push(fullPath);
                }
            }
        };
        
        scan(dir);
        return files;
    }

    // Ejecutar consolidación completa
    async run() {
        console.log('🚀 INICIANDO CONSOLIDACIÓN DE CONFIGURACIONES');
        console.log('==============================================\n');
        
        try {
            // Actualizar dependencias
            this.updatePackageVersions();
            
            // Consolidar variables de entorno
            this.consolidateEnvironmentVariables();
            
            // Crear configuración centralizada
            this.createCentralizedConfig();
            
            // Generar documentación
            const changeLog = this.generateChangeLog();
            
            console.log('\n✅ CONSOLIDACIÓN COMPLETADA');
            console.log('============================');
            console.log(`📊 Total de cambios realizados: ${this.changes.length}`);
            console.log(`📦 Dependencias actualizadas: ${this.changes.filter(c => c.type === 'dependency').length}`);
            console.log(`🔧 Variables de entorno consolidadas: ${this.changes.filter(c => c.type === 'environment').length}`);
            
            return changeLog;
            
        } catch (error) {
            console.error('❌ Error durante la consolidación:', error.message);
            throw error;
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const consolidator = new ConfigurationConsolidator();
    consolidator.run().catch(console.error);
}

module.exports = ConfigurationConsolidator;