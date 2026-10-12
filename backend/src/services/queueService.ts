import { Queue, Worker } from "bullmq";
import puppeteer from "puppeteer";
import { DocumentDraftModel } from "../models/DocumentDraft.js";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

const redisConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

let pdfExportQueue: Queue | null = null;
let isRedisAvailable = false;

try {
  pdfExportQueue = new Queue("pdf-export-queue", { connection: redisConnection });
  pdfExportQueue.waitUntilReady()
    .then(() => {
      isRedisAvailable = true;
      console.log(`[BullMQ Queue] Connected to Redis on ${REDIS_HOST}:${REDIS_PORT}`);
      setupPdfWorker();
    })
    .catch(() => {
      console.log(`[BullMQ Queue] Redis connection not reached on ${REDIS_HOST}:${REDIS_PORT}. Synchronous export active.`);
    });
} catch (e: any) {
  console.log(`[BullMQ Queue] Redis initialization skipped (${e.message}). Synchronous export active.`);
}

export async function generatePdfBuffer(title: string, htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.6;
              padding: 40px;
              margin: 0;
            }
            h1 { font-size: 26px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 20px; }
            h2 { font-size: 20px; color: #0f172a; margin-top: 24px; }
            h3 { font-size: 16px; color: #334155; }
            p { font-size: 14px; margin-bottom: 12px; }
            blockquote { border-left: 4px solid #3b82f6; padding-left: 12px; color: #475569; margin: 12px 0; }
            ul, ol { padding-left: 24px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
        </body>
      </html>
    `;

    await page.setContent(styledHtml, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function setupPdfWorker() {
  const worker = new Worker(
    "pdf-export-queue",
    async (job) => {
      console.log(`[Worker] Processing PDF export job: ${job.id} for "${job.data.title}"`);
      const buffer = await generatePdfBuffer(job.data.title, job.data.content);
      return { success: true, sizeBytes: buffer.length };
    },
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] PDF Job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] PDF Job ${job?.id} failed:`, err.message);
  });
}

export { pdfExportQueue, isRedisAvailable };
