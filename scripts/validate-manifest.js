#!/usr/bin/env node
/**
 * Валидатор manifest.json
 * Проверяет корректность структуры и данных в manifest.json
 * 
 * Использование:
 *   node scripts/validate-manifest.js
 * 
 * Или добавьте в package.json:
 *   "scripts": {
 *     "validate:manifest": "node scripts/validate-manifest.js"
 *   }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../index/manifest.json');
const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');

// Обязательные поля документа
const REQUIRED_FIELDS = ['id', 'title', 'path', 'type', 'domain', 'version', 'status'];

// Допустимые типы документов
const VALID_TYPES = ['reglament', 'guide', 'sample', 'template', 'spec', 'dictionary', 'bootstrap'];

// Допустимые статусы
const VALID_STATUSES = ['draft', 'approved', 'deprecated'];

// Допустимые домены
const VALID_DOMAINS = ['core', 'tmc', 'inspection', 'finance', 'hr', 'procurement', 'quality', 'safety', 'regulations'];

// Регулярное выражение для семантической версии
const VERSION_REGEX = /^\d+\.\d+\.\d+$/;

let errors = [];
let warnings = [];

function validateManifest() {
  console.log('🔍 Валидация manifest.json...\n');

  // Проверка существования файла
  if (!fs.existsSync(MANIFEST_PATH)) {
    errors.push(`Файл manifest.json не найден: ${MANIFEST_PATH}`);
    printResults();
    process.exit(1);
  }

  // Чтение и парсинг JSON
  let manifest;
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
    manifest = JSON.parse(content);
  } catch (error) {
    errors.push(`Ошибка парсинга JSON: ${error.message}`);
    printResults();
    process.exit(1);
  }

  // Проверка наличия массива documents
  if (!manifest.documents || !Array.isArray(manifest.documents)) {
    errors.push('Отсутствует массив documents в manifest.json');
    printResults();
    process.exit(1);
  }

  const documents = manifest.documents;
  const documentIds = new Set();
  const documentPaths = new Set();

  // Валидация каждого документа
  documents.forEach((doc, index) => {
    const docPrefix = `Документ #${index + 1} (id: ${doc.id || 'не указан'})`;

    // Проверка обязательных полей
    REQUIRED_FIELDS.forEach(field => {
      if (!doc.hasOwnProperty(field)) {
        errors.push(`${docPrefix}: отсутствует обязательное поле '${field}'`);
      }
    });

    // Проверка типа документа
    if (doc.type && !VALID_TYPES.includes(doc.type)) {
      errors.push(`${docPrefix}: недопустимый тип '${doc.type}'. Допустимые: ${VALID_TYPES.join(', ')}`);
    }

    // Проверка статуса
    if (doc.status && !VALID_STATUSES.includes(doc.status)) {
      errors.push(`${docPrefix}: недопустимый статус '${doc.status}'. Допустимые: ${VALID_STATUSES.join(', ')}`);
    }

    // Проверка домена
    if (doc.domain && !VALID_DOMAINS.includes(doc.domain)) {
      warnings.push(`${docPrefix}: нестандартный домен '${doc.domain}'. Стандартные: ${VALID_DOMAINS.join(', ')}`);
    }

    // Проверка версии
    if (doc.version && !VERSION_REGEX.test(doc.version)) {
      errors.push(`${docPrefix}: неверный формат версии '${doc.version}'. Используйте семантическую версию (например, 1.0.0)`);
    }

    // Проверка дублей ID
    if (doc.id) {
      if (documentIds.has(doc.id)) {
        errors.push(`${docPrefix}: дублирующийся ID '${doc.id}'`);
      }
      documentIds.add(doc.id);
    }

    // Проверка дублей путей
    if (doc.path) {
      if (documentPaths.has(doc.path)) {
        errors.push(`${docPrefix}: дублирующийся путь '${doc.path}'`);
      }
      documentPaths.add(doc.path);

      // Проверка существования файла
      const filePath = path.join(__dirname, '..', doc.path);
      if (!fs.existsSync(filePath)) {
        warnings.push(`${docPrefix}: файл не найден по пути '${doc.path}'`);
      }
    }

    // Проверка supersedes
    if (doc.supersedes) {
      if (!documentIds.has(doc.supersedes)) {
        warnings.push(`${docPrefix}: ссылается на несуществующий документ '${doc.supersedes}' в поле supersedes`);
      }
    }

    // Проверка effective_date для регламентов
    if (doc.type === 'reglament' && doc.status === 'approved' && !doc.effective_date) {
      warnings.push(`${docPrefix}: регламент со статусом approved должен иметь поле effective_date`);
    }

    // Проверка updated_at
    if (doc.updated_at) {
      const date = new Date(doc.updated_at);
      if (isNaN(date.getTime())) {
        errors.push(`${docPrefix}: неверный формат даты в updated_at '${doc.updated_at}'. Используйте ISO 8601`);
      }
    }
  });

  // Проверка deprecated документов
  const deprecatedDocs = documents.filter(doc => doc.status === 'deprecated');
  deprecatedDocs.forEach(doc => {
    if (!doc.supersedes) {
      warnings.push(`Документ '${doc.id}' помечен как deprecated, но не указан supersedes`);
    }
  });

  // Проверка: все файлы из knowledge/ должны быть в manifest
  checkKnowledgeFilesInManifest(manifest, documentPaths);

  printResults();

  if (errors.length > 0) {
    process.exit(1);
  }
}

function getAllKnowledgeFiles() {
  const files = [];
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    return files;
  }
  
  ['reglaments', 'guides', 'samples'].forEach(dir => {
    const dirPath = path.join(KNOWLEDGE_DIR, dir);
    if (!fs.existsSync(dirPath)) return;
    
    const dirFiles = fs.readdirSync(dirPath)
      .filter(file => {
        const filePath = path.join(dirPath, file);
        try {
          const stat = fs.statSync(filePath);
          return stat.isFile() && file !== '.DS_Store' && file !== 'README.md';
        } catch (e) {
          return false;
        }
      })
      .map(file => {
        const relativePath = `knowledge/${dir}/${file}`;
        return {
          fileName: file,
          relativePath: relativePath,
          fullPath: path.join(dirPath, file)
        };
      });
    
    files.push(...dirFiles);
  });
  
  return files;
}

function checkKnowledgeFilesInManifest(manifest, manifestPaths) {
  console.log('🔍 Проверка соответствия файлов knowledge/ и manifest...\n');
  
  const knowledgeFiles = getAllKnowledgeFiles();
  const manifestPathsSet = new Set(manifestPaths);
  
  // Проверяем, что каждый файл из knowledge/ есть в manifest
  knowledgeFiles.forEach(file => {
    if (!manifestPathsSet.has(file.relativePath)) {
      errors.push(`Файл из knowledge/ отсутствует в manifest: ${file.relativePath}`);
    }
  });
  
  console.log(`   Проверено файлов в knowledge/: ${knowledgeFiles.length}`);
  console.log(`   Записей в manifest: ${manifestPaths.size}\n`);
}

function printResults() {
  if (errors.length > 0) {
    console.log('❌ Ошибки:\n');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Предупреждения:\n');
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Валидация пройдена успешно!\n');
  } else if (errors.length === 0) {
    console.log('✅ Критических ошибок не найдено, но есть предупреждения.\n');
  }
}

// Запуск валидации
validateManifest();
