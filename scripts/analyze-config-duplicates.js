#!/usr/bin/env node

/**
 * Análisis de Configuraciones Duplicadas - TechNovaStore
 * 
 * Este script analiza todas las configuraciones del proyecto para identificar:
 * 1. Dependencias duplicadas en package.json
 * 2. Variables de entorno repetidas o inconsistentes
 * 3. Configuraciones Docker similares
 * 4. Oportunidades de consolidación
 */

const fs = require('fs');
const path = require('path');

class ConfigurationAnalyzer {
    constructor() {
        this.packageFiles = [];
        this.envFiles = [];
        this.duplicateDependencies = new Map();
        this.envVariables = new Map();
        this.consolidationReport = {
            dependencies: {},
            envVars: {},
            recommendations: []
        };
    }

    // Buscar todos los archivos package.json
    findPackageFiles(dir = '.', exclude = ['node_modules', 'dist', '.git']) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !exclude.includes(file)) {
                this.findPackageFiles(fullPath, exclude);
            } else if (file === 'package.json') {
                this.packageFiles.push(fullPath);
            }
        }
    }

    // Buscar todos los archivos .env.example
    findEnvFiles(dir = '.', exclude = ['node_modules', 'dist', '.git']) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !exclude.includes(file)) {
                this.findEnvFiles(fullPath, exclude);
            } else if (file.includes('.env')) {
                this.envFiles.push(fullPath);
            }
        }
    }

    // Analizar dependencias duplicadas
    analyzeDependencies() {
        console.log('🔍 Analizando dependencias en package.json...\n');
        
        const allDependencies = new Map();
        const versionConflicts = new Map();
        
        for (const packageFile of this.packageFiles) {
            try {
                const content = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                const packageName = content.name || path.dirname(packageFile);
                
                // Analizar dependencies
                if (content.dependencies) {
                    this.processDependencies(content.dependencies, packageName, 'dependencies', allDependencies, versionConflicts);
                }
                
                // Analizar devDependencies
                if (content.devDependencies) {
                    this.processDependencies(content.devDependencies, packageName, 'devDependencies', allDependencies, versionConflicts);
                }
                
            } catch (error) {
                console.error(`❌ Error leyendo ${packageFile}: ${error.message}`);
            }
        }
        
        this.reportDependencyAnalysis(allDependencies, versionConflicts);
    }

    processDependencies(deps, packageName, type, allDependencies, versionConflicts) {
        for (const [depName, version] of Object.entries(deps)) {
            if (!allDependencies.has(depName)) {
                allDependencies.set(depName, []);
            }
            
            const usage = { package: packageName, version, type };
            allDependencies.get(depName).push(usage);
            
            // Detectar conflictos de versión
            const existingVersions = allDependencies.get(depName).map(u => u.version);
            const uniqueVersions = [...new Set(existingVersions)];
            
            if (uniqueVersions.length > 1) {
                versionConflicts.set(depName, allDependencies.get(depName));
            }
        }
    }

    reportDependencyAnalysis(allDependencies, versionConflicts) {
        // Dependencias más utilizadas
        const mostUsed = [...allDependencies.entries()]
            .filter(([_, usages]) => usages.length > 1)
            .sort((a, b) => b[1].length - a[1].length);
        
        console.log('📊 DEPENDENCIAS MÁS UTILIZADAS:');
        console.log('================================');
        
        for (const [depName, usages] of mostUsed.slice(0, 15)) {
            console.log(`\n📦 ${depName} (usado en ${usages.length} paquetes):`);
            for (const usage of usages) {
                console.log(`   - ${usage.package}: ${usage.version} (${usage.type})`);
            }
        }
        
        // Conflictos de versión
        if (versionConflicts.size > 0) {
            console.log('\n\n⚠️  CONFLICTOS DE VERSIÓN DETECTADOS:');
            console.log('====================================');
            
            for (const [depName, usages] of versionConflicts) {
                console.log(`\n🔴 ${depName}:`);
                for (const usage of usages) {
                    console.log(`   - ${usage.package}: ${usage.version}`);
                }
            }
        }
        
        this.consolidationReport.dependencies = {
            totalPackages: this.packageFiles.length,
            mostUsed: mostUsed.slice(0, 10),
            conflicts: [...versionConflicts.entries()]
        };
    }

    // Analizar variables de entorno
    analyzeEnvironmentVariables() {
        console.log('\n\n🔍 Analizando variables de entorno...\n');
        
        const allEnvVars = new Map();
        const duplicateVars = new Map();
        
        for (const envFile of this.envFiles) {
            try {
                const content = fs.readFileSync(envFile, 'utf8');
                const lines = content.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                        const [key, ...valueParts] = trimmed.split('=');
                        const value = valueParts.join('=');
                        
                        if (!allEnvVars.has(key)) {
                            allEnvVars.set(key, []);
                        }
                        
                        allEnvVars.get(key).push({
                            file: envFile,
                            value: value,
                            line: trimmed
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Error leyendo ${envFile}: ${error.message}`);
            }
        }
        
        // Identificar variables duplicadas
        for (const [varName, usages] of allEnvVars) {
            if (usages.length > 1) {
                duplicateVars.set(varName, usages);
            }
        }
        
        this.reportEnvironmentAnalysis(allEnvVars, duplicateVars);
    }

    reportEnvironmentAnalysis(allEnvVars, duplicateVars) {
        console.log('📊 VARIABLES DE ENTORNO DUPLICADAS:');
        console.log('===================================');
        
        for (const [varName, usages] of duplicateVars) {
            console.log(`\n🔄 ${varName}:`);
            
            const uniqueValues = [...new Set(usages.map(u => u.value))];
            
            if (uniqueValues.length > 1) {
                console.log('   ⚠️  VALORES INCONSISTENTES:');
            }
            
            for (const usage of usages) {
                console.log(`   - ${usage.file}: ${usage.value}`);
            }
        }
        
        this.consolidationReport.envVars = {
            totalFiles: this.envFiles.length,
            totalVars: allEnvVars.size,
            duplicates: [...duplicateVars.entries()]
        };
    }

    // Generar recomendaciones de consolidación
    generateRecommendations() {
        console.log('\n\n💡 RECOMENDACIONES DE CONSOLIDACIÓN:');
        console.log('====================================');
        
        const recommendations = [];
        
        // Recomendaciones para dependencias
        const { conflicts, mostUsed } = this.consolidationReport.dependencies;
        
        if (conflicts.length > 0) {
            recommendations.push({
                type: 'dependencies',
                priority: 'high',
                title: 'Resolver conflictos de versión de dependencias',
                description: `Se encontraron ${conflicts.length} dependencias con versiones conflictivas`,
                actions: conflicts.map(([dep, usages]) => ({
                    dependency: dep,
                    action: 'Estandarizar a la versión más reciente compatible',
                    packages: usages.map(u => u.package)
                }))
            });
        }
        
        // Recomendaciones para variables de entorno
        const { duplicates } = this.consolidationReport.envVars;
        
        if (duplicates.length > 0) {
            const inconsistentVars = duplicates.filter(([_, usages]) => {
                const uniqueValues = [...new Set(usages.map(u => u.value))];
                return uniqueValues.length > 1;
            });
            
            if (inconsistentVars.length > 0) {
                recommendations.push({
                    type: 'environment',
                    priority: 'high',
                    title: 'Estandarizar variables de entorno inconsistentes',
                    description: `Se encontraron ${inconsistentVars.length} variables con valores diferentes`,
                    actions: inconsistentVars.map(([varName, usages]) => ({
                        variable: varName,
                        action: 'Definir valor estándar y actualizar todos los archivos',
                        files: usages.map(u => u.file)
                    }))
                });
            }
        }
        
        // Recomendaciones de optimización
        if (mostUsed.length > 0) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                title: 'Mover dependencias comunes a shared packages',
                description: 'Optimizar dependencias frecuentemente utilizadas',
                actions: mostUsed.slice(0, 5).map(([dep, usages]) => ({
                    dependency: dep,
                    action: `Considerar mover a shared/config (usado en ${usages.length} paquetes)`,
                    packages: usages.map(u => u.package)
                }))
            });
        }
        
        // Mostrar recomendaciones
        for (const rec of recommendations) {
            console.log(`\n${rec.priority === 'high' ? '🔴' : '🟡'} ${rec.title}`);
            console.log(`   ${rec.description}`);
            
            for (const action of rec.actions.slice(0, 3)) {
                if (action.dependency) {
                    console.log(`   - ${action.dependency}: ${action.action}`);
                } else if (action.variable) {
                    console.log(`   - ${action.variable}: ${action.action}`);
                }
            }
            
            if (rec.actions.length > 3) {
                console.log(`   ... y ${rec.actions.length - 3} más`);
            }
        }
        
        this.consolidationReport.recommendations = recommendations;
    }

    // Generar reporte completo
    generateReport() {
        const reportPath = 'consolidation-analysis-report.json';
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                packageFiles: this.packageFiles.length,
                envFiles: this.envFiles.length,
                dependencyConflicts: this.consolidationReport.dependencies.conflicts?.length || 0,
                envDuplicates: this.consolidationReport.envVars.duplicates?.length || 0,
                recommendations: this.consolidationReport.recommendations.length
            },
            details: this.consolidationReport,
            files: {
                packages: this.packageFiles,
                environment: this.envFiles
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n\n📄 Reporte completo guardado en: ${reportPath}`);
        console.log('\n✅ Análisis de configuraciones completado.');
        
        return report;
    }

    // Ejecutar análisis completo
    async run() {
        console.log('🚀 INICIANDO ANÁLISIS DE CONFIGURACIONES DUPLICADAS');
        console.log('==================================================\n');
        
        // Buscar archivos
        this.findPackageFiles();
        this.findEnvFiles();
        
        console.log(`📁 Encontrados ${this.packageFiles.length} archivos package.json`);
        console.log(`📁 Encontrados ${this.envFiles.length} archivos de entorno\n`);
        
        // Ejecutar análisis
        this.analyzeDependencies();
        this.analyzeEnvironmentVariables();
        this.generateRecommendations();
        
        // Generar reporte
        return this.generateReport();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const analyzer = new ConfigurationAnalyzer();
    analyzer.run().catch(console.error);
}

module.exports = ConfigurationAnalyzer;