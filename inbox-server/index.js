import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Пути
const DATA_DIR = path.join(__dirname, "../data");
const INBOX_DIR = path.join(DATA_DIR, "ai-inbox");
const DB_PATH = path.join(DATA_DIR, "db", "inbox.db");

// Создаём директории если их нет
[INBOX_DIR, path.join(DATA_DIR, "db")].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Инициализация БД
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS file_registry (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS ai_extraction_run (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT DEFAULT 'running',
    error TEXT,
    FOREIGN KEY (file_id) REFERENCES file_registry(id)
  );

  CREATE TABLE IF NOT EXISTS ai_extraction_field (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    field_code TEXT NOT NULL,
    value TEXT,
    confidence REAL,
    provenance TEXT,
    FOREIGN KEY (run_id) REFERENCES ai_extraction_run(id)
  );

  CREATE TABLE IF NOT EXISTS tmc_request_draft (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    extraction_run_id TEXT,
    status TEXT DEFAULT 'draft',
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (file_id) REFERENCES file_registry(id),
    FOREIGN KEY (extraction_run_id) REFERENCES ai_extraction_run(id)
  );
`);

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, INBOX_DIR);
  },
  filename: (req, file, cb) => {
    // Формат: uuid_originalName
    const uuid = randomUUID();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuid}_${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Неподдерживаемый тип файла. Разрешены только PDF и DOCX"));
    }
  },
});

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Загрузка промптов
function loadPrompts() {
  const promptsDir = path.join(__dirname, "../prompts");
  const systemPrompt = fs.readFileSync(path.join(promptsDir, "system.md"), "utf8");
  const policyPrompt = fs.readFileSync(path.join(promptsDir, "policy.md"), "utf8");
  
  let domainPrompts = {};
  const domainDir = path.join(promptsDir, "domain");
  if (fs.existsSync(domainDir)) {
    const domainFiles = fs.readdirSync(domainDir);
    domainFiles.forEach(file => {
      if (file.endsWith(".md")) {
        const domain = file.replace(".md", "");
        domainPrompts[domain] = fs.readFileSync(path.join(domainDir, file), "utf8");
      }
    });
  }
  
  return { systemPrompt, policyPrompt, domainPrompts };
}

// Получить список файлов
app.get("/api/inbox/files", (req, res) => {
  try {
    const files = db
      .prepare("SELECT * FROM file_registry ORDER BY created_at DESC")
      .all();
    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Загрузить файл
app.post("/api/inbox/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Вычисляем SHA256
    const fileBuffer = fs.readFileSync(req.file.path);
    const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
    
    // Извлекаем UUID из имени файла (формат: uuid_originalName)
    const uuid = req.file.filename.split("_")[0];
    const storedPath = path.join("ai-inbox", req.file.filename);
    
    const stmt = db.prepare(`
      INSERT INTO file_registry (id, original_name, stored_path, mime, size, sha256, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdAt = new Date().toISOString();
    const fileRecord = {
      id: uuid,
      originalName: req.file.originalname,
      storedPath,
      mime: req.file.mimetype,
      size: req.file.size,
      sha256,
      createdAt,
      status: "pending",
    };

    stmt.run(
      fileRecord.id,
      fileRecord.originalName,
      fileRecord.storedPath,
      fileRecord.mime,
      fileRecord.size,
      fileRecord.sha256,
      fileRecord.createdAt,
      fileRecord.status
    );

    res.json(fileRecord);
  } catch (error) {
    console.error("Error saving file:", error);
    res.status(500).json({ error: "Failed to save file" });
  }
});

// Скачать файл
app.get("/api/inbox/files/:id/download", (req, res) => {
  try {
    const file = db
      .prepare("SELECT * FROM file_registry WHERE id = ?")
      .get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // stored_path может быть относительным или абсолютным
    const filePath = file.stored_path.startsWith("/") 
      ? file.stored_path 
      : path.join(DATA_DIR, file.stored_path);
      
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(filePath, file.original_name);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// Удалить файл
app.delete("/api/inbox/files/:id", (req, res) => {
  try {
    const file = db
      .prepare("SELECT * FROM file_registry WHERE id = ?")
      .get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Удаляем файл с диска
    const filePath = file.stored_path.startsWith("/") 
      ? file.stored_path 
      : path.join(DATA_DIR, file.stored_path);
      
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Удаляем запись из БД
    db.prepare("DELETE FROM file_registry WHERE id = ?").run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Запуск Extract
app.post("/api/inbox/files/:id/extract", async (req, res) => {
  try {
    const file = db
      .prepare("SELECT * FROM file_registry WHERE id = ?")
      .get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const runId = randomUUID();
    const startedAt = new Date().toISOString();

    // Создаём запись о запуске
    db.prepare(
      "INSERT INTO ai_extraction_run (id, file_id, started_at, status) VALUES (?, ?, ?, ?)"
    ).run(runId, file.id, startedAt, "running");

    // Загружаем промпты
    const prompts = loadPrompts();
    
    // Логируем использование промптов
    // console.log(`[Extract] Run ${runId} started for file ${file.id}`);
    console.log(`[Extract] Using prompts: system.md, policy.md`);
    if (Object.keys(prompts.domainPrompts).length > 0) {
      console.log(`[Extract] Domain prompts: ${Object.keys(prompts.domainPrompts).join(", ")}`);
    }
    
    // TODO: Здесь будет вызов AI для извлечения данных
    // Пока симулируем извлечение с задержкой
    setTimeout(() => {
      // Пример извлечённых полей с provenance
      const sampleFields = [
        { 
          code: "doc_number", 
          value: "DOC-2026-001", 
          confidence: 0.95,
          provenance: "Страница 1, верхний колонтитул"
        },
        { 
          code: "doc_date", 
          value: "2026-01-25", 
          confidence: 0.90,
          provenance: "Страница 1, строка 2"
        },
        { 
          code: "organization", 
          value: "MURA MENASA FZCO", 
          confidence: 0.88,
          provenance: "Страница 1, блок подписи"
        },
      ];

      // Сохраняем поля
      const fieldStmt = db.prepare(
        "INSERT INTO ai_extraction_field (id, run_id, field_code, value, confidence, provenance) VALUES (?, ?, ?, ?, ?, ?)"
      );

      sampleFields.forEach((field, index) => {
        const fieldId = randomUUID();
        fieldStmt.run(fieldId, runId, field.code, field.value, field.confidence, field.provenance);
      });

      // Обновляем статус запуска
      db.prepare(
        "UPDATE ai_extraction_run SET completed_at = ?, status = ? WHERE id = ?"
      ).run(new Date().toISOString(), "completed", runId);
      
      console.log(`[Extract] Run ${runId} completed successfully`);
    }, 2000);

    res.json({ runId, status: "running", startedAt });
  } catch (error) {
    console.error("Error starting extraction:", error);
    res.status(500).json({ error: "Failed to start extraction" });
  }
});

// Получить результаты Extract
app.get("/api/inbox/extractions/:runId", (req, res) => {
  try {
    const run = db
      .prepare("SELECT * FROM ai_extraction_run WHERE id = ?")
      .get(req.params.runId);

    if (!run) {
      return res.status(404).json({ error: "Extraction run not found" });
    }

    const fields = db
      .prepare("SELECT * FROM ai_extraction_field WHERE run_id = ?")
      .all(req.params.runId);

    res.json({ run, fields });
  } catch (error) {
    console.error("Error fetching extraction:", error);
    res.status(500).json({ error: "Failed to fetch extraction" });
  }
});

// Apply - создание draft сущности
app.post("/api/inbox/files/:id/apply", (req, res) => {
  try {
    const file = db
      .prepare("SELECT * FROM file_registry WHERE id = ?")
      .get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Находим последний успешный запуск Extract
    const run = db
      .prepare(
        "SELECT * FROM ai_extraction_run WHERE file_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 1"
      )
      .get(req.params.id);

    if (!run) {
      return res.status(400).json({ error: "No completed extraction found for this file" });
    }

    // Получаем извлечённые поля
    const fields = db
      .prepare("SELECT * FROM ai_extraction_field WHERE run_id = ?")
      .all(run.id);

    // Создаём draft сущность в tmc_request_draft
    const draftId = randomUUID();
    const createdAt = new Date().toISOString();
    
    // Преобразуем поля в JSON для хранения
    const draftData = {
      sourceFile: file.original_name,
      extractionRunId: run.id,
      fields: fields.map((f) => ({
        code: f.field_code,
        value: f.value,
        confidence: f.confidence,
        provenance: f.provenance,
      })),
    };

    // Сохраняем draft в БД
    const draftStmt = db.prepare(`
      INSERT INTO tmc_request_draft (id, file_id, extraction_run_id, status, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    draftStmt.run(
      draftId,
      file.id,
      run.id,
      "draft",
      JSON.stringify(draftData),
      createdAt
    );

    console.log(`[Apply] Draft ${draftId} created from file ${file.id}, extraction ${run.id}`);

    res.json({
      success: true,
      draftId,
      message: "Черновик создан успешно. Требуется подтверждение для активации.",
      status: "draft",
      createdAt,
      fields: fields.map((f) => ({
        code: f.field_code,
        value: f.value,
        confidence: f.confidence,
        provenance: f.provenance,
      })),
    });
  } catch (error) {
    console.error("Error applying extraction:", error);
    res.status(500).json({ error: "Failed to apply extraction" });
  }
});

// Получить список draft сущностей
app.get("/api/tmc/drafts", (req, res) => {
  try {
    const drafts = db
      .prepare("SELECT * FROM tmc_request_draft ORDER BY created_at DESC")
      .all();
    
    // Парсим JSON данные
    const draftsWithData = drafts.map(draft => ({
      ...draft,
      data: JSON.parse(draft.data),
    }));
    
    res.json(draftsWithData);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ error: "Failed to fetch drafts" });
  }
});

// Получить draft по ID
app.get("/api/tmc/drafts/:id", (req, res) => {
  try {
    const draft = db
      .prepare("SELECT * FROM tmc_request_draft WHERE id = ?")
      .get(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }
    
    draft.data = JSON.parse(draft.data);
    res.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
