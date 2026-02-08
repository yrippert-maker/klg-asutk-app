#!/usr/bin/env node
/**
 * Скрипт для добавления всех файлов из knowledge/ в manifest.json
 * Приводит все записи к единому формату с обязательными полями
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../index/manifest.json');
const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');

// Ключевые документы для статуса approved (3-5 документов)
const KEY_DOCUMENTS_PATTERNS = [
  /papa_project_bootstrap/i,
  /145\.1в/i,
  /рц-ап-145/i,
  /tv3_117_kniga_1.*turboval/i,
  /tech_cards_registry/i
];

function getDocumentType(filePath) {
  const dir = path.dirname(filePath).split(path.sep).pop();
  if (dir === 'reglaments') return 'reglament';
  if (dir === 'guides') return 'template';
  if (dir === 'samples') return 'sample';
  return 'reglament';
}

function getDomain(filePath, fileName) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('tmc') || lowerName.includes('tv3') || lowerName.includes('двигател') || lowerName.includes('byulleten')) return 'tmc';
  if (lowerName.includes('145') || lowerName.includes('183') || lowerName.includes('регламент') || lowerName.includes('руководство')) return 'regulations';
  if (lowerName.includes('анкет') || lowerName.includes('hr')) return 'hr';
  if (lowerName.includes('инспекц')) return 'inspection';
  return 'core';
}

function generateId(type, index) {
  const prefix = type === 'reglament' ? 'reg' : type === 'template' ? 'guide' : 'sample';
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function getTitle(fileName) {
  // Убираем расширение
  let title = fileName.replace(/\.[^.]+$/, '');
  // Убираем "— копия" и подобное
  title = title.replace(/\s*—\s*копия\s*/gi, '').trim();
  // Если название слишком длинное, обрезаем
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  return title || fileName;
}

function isKeyDocument(fileName) {
  return KEY_DOCUMENTS_PATTERNS.some(pattern => pattern.test(fileName));
}

function getAllFiles() {
  const files = [];
  
  ['reglaments', 'guides', 'samples'].forEach(dir => {
    const dirPath = path.join(KNOWLEDGE_DIR, dir);
    if (!fs.existsSync(dirPath)) return;
    
    const dirFiles = fs.readdirSync(dirPath)
      .filter(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        return stat.isFile() && file !== '.DS_Store' && file !== 'README.md';
      })
      .map(file => ({
        fileName: file,
        filePath: path.join(dir, file),
        fullPath: path.join(dirPath, file)
      }));
    
    files.push(...dirFiles);
  });
  
  return files;
}

function updateManifest() {
  console.log('🔍 Сканирование файлов в knowledge/...\n');
  
  // Получаем все файлы
  const allFiles = getAllFiles();
  console.log(`Найдено файлов: ${allFiles.length}\n`);
  
  // Генерируем документы для всех файлов
  const documents = [];
  let regIndex = 1;
  let guideIndex = 1;
  let sampleIndex = 1;
  
  // Сортируем файлы для консистентности
  allFiles.sort((a, b) => {
    const typeA = getDocumentType(a.filePath);
    const typeB = getDocumentType(b.filePath);
    const typeOrder = { reglament: 0, template: 1, sample: 2 };
    if (typeOrder[typeA] !== typeOrder[typeB]) {
      return typeOrder[typeA] - typeOrder[typeB];
    }
    return a.fileName.localeCompare(b.fileName);
  });
  
  allFiles.forEach(file => {
    const relativePath = `knowledge/${file.filePath}`;
    const type = getDocumentType(relativePath);
    
    // Генерируем ID
    let id;
    if (type === 'reglament') {
      id = generateId('reglament', regIndex++);
    } else if (type === 'template') {
      id = generateId('template', guideIndex++);
    } else {
      id = generateId('sample', sampleIndex++);
    }
    
    const doc = {
      id,
      title: getTitle(file.fileName),
      path: relativePath,
      type,
      domain: getDomain(relativePath, file.fileName),
      version: '1.0.0',
      status: isKeyDocument(file.fileName) ? 'approved' : 'draft'
    };
    
    documents.push(doc);
  });
  
  // Читаем текущий manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  
  // Обновляем manifest
  manifest.documents = documents;
  manifest.manifest.lastUpdated = new Date().toISOString();
  
  // Обновляем метаданные
  const statusBreakdown = { approved: 0, draft: 0, deprecated: 0 };
  const fileTypes = {};
  
  documents.forEach(doc => {
    statusBreakdown[doc.status] = (statusBreakdown[doc.status] || 0) + 1;
    const ext = path.extname(doc.path).slice(1).toLowerCase();
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
  });
  
  manifest.metadata.documentCount = documents.length;
  manifest.metadata.statusBreakdown = statusBreakdown;
  manifest.metadata.fileTypes = fileTypes;
  
  // Сохраняем
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  
  console.log(`✅ Обновлено документов: ${documents.length}`);
  console.log(`   - Approved: ${statusBreakdown.approved}`);
  console.log(`   - Draft: ${statusBreakdown.draft}`);
  console.log(`   - Deprecated: ${statusBreakdown.deprecated}\n`);
}

updateManifest();
