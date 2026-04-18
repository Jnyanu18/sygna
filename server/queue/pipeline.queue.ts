import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import type { PipelineJob } from "../engine/pipeline";
import { runPipeline } from "../engine/pipeline";

let queue: Queue<PipelineJob> | null = null;
let worker: Worker<PipelineJob> | null = null;

export function initPipelineQueue(): Queue<PipelineJob> | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(
      "SYGNA: REDIS_URL not set — webhooks run the pipeline in-process (no BullMQ)."
    );
    return null;
  }

  const connection = new IORedis(url, { maxRetriesPerRequest: null });

  queue = new Queue<PipelineJob>("sygna-pipeline", { connection });

  worker = new Worker<PipelineJob>(
    "sygna-pipeline",
    async (job) => {
      await runPipeline(job.data);
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error("SYGNA BullMQ job failed:", job?.id, err);
  });

  return queue;
}

export function getPipelineQueue(): Queue<PipelineJob> | null {
  return queue;
}
