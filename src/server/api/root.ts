import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { channelRouter } from "./routers/channel";
import { messageRouter } from "./routers/message";
import { patientRouter } from "./routers/patient";
import { preoperativeEvaluationRouter } from "./routers/preoperativeEvaluation";
import { operationNoteRouter } from "./routers/operationNote";
import { notificationRouter } from "./routers/notification";
import { userRouter } from "@/server/api/routers/user";
import { twoFactorRouter } from "./routers/twoFactor";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  channel: channelRouter,
  message: messageRouter,
  patient: patientRouter,
  preoperativeEvaluation: preoperativeEvaluationRouter,
  operationNote: operationNoteRouter,
  notification: notificationRouter,
  twoFactor: twoFactorRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
