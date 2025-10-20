#!/usr/bin/env node

/**
 * Build script for @rumenx/chatbot
 * Handles dual ESM/CJS compilation with proper module extensions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building @rumenx/chatbot...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf dist/ components/', { stdio: 'inherit' });
} catch {
  // Directory might not exist, that's fine
}

// Build TypeScript declarations
console.log('📝 Building TypeScript declarations...');
execSync('tsc --project tsconfig.json --emitDeclarationOnly --outDir dist/types', { 
  stdio: 'inherit' 
});

// Build ESM
console.log('📦 Building ESM modules...');
execSync('tsc --project tsconfig.json --outDir dist/esm', { 
  stdio: 'inherit' 
});

// Build CJS
console.log('📦 Building CommonJS modules...');
execSync('tsc --project tsconfig.cjs.json', { 
  stdio: 'inherit' 
});

// Fix module extensions for CJS
console.log('🔧 Fixing CommonJS module extensions...');
fixCjsExtensions();

// Create package.json files for proper module resolution
console.log('📄 Creating package.json files for module resolution...');
createModulePackageFiles();

console.log('\n✅ Build completed successfully!');

function fixCjsExtensions() {
  const cjsDir = path.join(__dirname, 'dist', 'cjs');
  
  if (!fs.existsSync(cjsDir)) {
    return;
  }
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.js')) {
        processFile(filePath);
      }
    }
  }
  
  function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative imports to include .js extension
    content = content.replace(
      /require\("(\.\/.+?)"\)/g,
      (match, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.includes('.')) {
          return `require("${importPath}.js")`;
        }
        return match;
      }
    );
    
    fs.writeFileSync(filePath, content);
  }
  
  processDirectory(cjsDir);
}

function createModulePackageFiles() {
  // Create package.json for ESM
  const esmPackageJson = {
    type: 'module'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'esm', 'package.json'),
    JSON.stringify(esmPackageJson, null, 2)
  );
  
  // Create package.json for CJS
  const cjsPackageJson = {
    type: 'commonjs'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'cjs', 'package.json'),
    JSON.stringify(cjsPackageJson, null, 2)
  );
}