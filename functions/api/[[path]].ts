import worker from "../../worker/index";
import type { WorkerEnv } from "../../worker/types";

interface PagesFunctionContext {
  request: Request;
  env: WorkerEnv;
  waitUntil: (promise: Promise<unknown>) => void;
}

export async function onRequest(
  context: PagesFunctionContext
): Promise<Response> {
  return worker.fetch(context.request, context.env, {
    waitUntil: (promise) => context.waitUntil(promise),
  });
}
