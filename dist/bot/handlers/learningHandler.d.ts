import { BotContext } from '../../types/context';
export declare function getLearningState(step: number): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export declare function sendLearningStep(ctx: BotContext, stepIndex: number): Promise<void>;
export declare function startLearningPath(ctx: BotContext): Promise<void>;
export declare function resumeLearningPath(ctx: BotContext): Promise<void>;
export declare function handleLearningMenuAction(ctx: BotContext): Promise<void>;
export declare function handleLearningCallback(ctx: BotContext): Promise<void>;
//# sourceMappingURL=learningHandler.d.ts.map