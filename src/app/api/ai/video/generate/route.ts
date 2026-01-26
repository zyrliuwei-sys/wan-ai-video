import { AIMediaType, AITaskStatus } from '@/extensions/ai';
import { getUuid } from '@/shared/lib/hash';
import { createAITask, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { respData, respErr } from '@/shared/lib/resp';

import { evolinkAPI } from '@/extensions/ai/evolink';
import { replicateAPI } from '@/extensions/ai/replicate';

const buildErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Video generation cost credits based on type and duration
const getVideoCostCredits = (
  type: string,
  duration: number = 5
): number => {
  const baseCredits = type === 'text-to-video' ? 6 : 8;
  // Add extra cost for longer videos
  const durationMultiplier = Math.ceil(duration / 5);
  return baseCredits * durationMultiplier;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type, // 'text-to-video' | 'image-to-video'
      prompt,
      imageUrl,
      aspectRatio = '16:9',
      quality = '720p',
      duration = 5,
      promptExtend = true,
      shotType = 'single',
      audioUrl,
      callbackUrl,
    } = body;

    if (!type) {
      return respErr('Missing required field: type');
    }

    if (type === 'text-to-video' && !prompt) {
      return respErr('Missing required field: prompt for text-to-video');
    }

    if (type === 'image-to-video' && !imageUrl) {
      return respErr('Missing required field: imageUrl for image-to-video');
    }

    // ========== AUTH CHECK ==========
    // Get current user
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    // ========== CREDITS CHECK ==========
    // Calculate cost credits
    const costCredits = getVideoCostCredits(type, duration);

    // Check if user has enough credits
    const remainingCredits = await getRemainingCredits(user.id);
    if (remainingCredits < costCredits) {
      return respErr(`insufficient credits, required: ${costCredits}, remaining: ${remainingCredits}`);
    }

    // ========== VIDEO GENERATION ==========
    const errors: string[] = [];
    let result:
      | { taskId: string; taskStatus: AITaskStatus; provider: string }
      | undefined;

    // Try Replicate first
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const apiResult =
          type === 'text-to-video'
            ? await replicateAPI.textToVideo({
                prompt,
                aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
                duration,
              })
            : await replicateAPI.imageToVideo({
                prompt: prompt || 'Animate this image',
                imageUrl,
                duration,
              });

        result = {
          taskId: apiResult.taskId,
          taskStatus: apiResult.taskStatus,
          provider: 'replicate',
        };
      } catch (error) {
        errors.push(`replicate: ${buildErrorMessage(error)}`);
      }
    }

    // Fallback to Evolink
    if (!result && process.env.EVOLINK_API_KEY) {
      try {
        const apiResult =
          type === 'text-to-video'
            ? await evolinkAPI.textToVideo({
                prompt,
                aspectRatio,
                quality,
                duration,
                promptExtend,
                shotType,
                audioUrl,
                callbackUrl,
              })
            : await evolinkAPI.imageToVideo({
                imageUrl,
                prompt,
                aspectRatio,
                quality,
                duration,
                promptExtend,
                shotType,
                audioUrl,
                callbackUrl,
              });

        if (
          apiResult.status === 'failed' ||
          apiResult.status === 'cancelled'
        ) {
          let failureDetail = '';
          try {
            const statusResult = await evolinkAPI.getTaskStatus(apiResult.id);
            const errorMessage =
              statusResult.error?.message || statusResult.error?.code || '';
            if (errorMessage) failureDetail = `: ${errorMessage}`;
          } catch {
            // Ignore status fetch failures; use a generic message.
          }
          throw new Error(`Evolink task failed on create${failureDetail}`);
        }

        result = {
          taskId: apiResult.id,
          taskStatus: apiResult.status as AITaskStatus,
          provider: 'evolink',
        };
      } catch (error) {
        errors.push(`evolink: ${buildErrorMessage(error)}`);
      }
    }

    // No provider succeeded
    if (!result) {
      return respErr(
        `No available provider could create the task: ${errors.join(' | ') || 'Missing API keys for video providers'}`
      );
    }

    // ========== CREATE AI TASK AND DEDUCT CREDITS ==========
    const newAITask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType: AIMediaType.VIDEO,
      provider: result.provider,
      model: type === 'text-to-video' ? 'wan-2.5-t2v' : 'wan-2.5-i2v',
      prompt: prompt || (imageUrl ? `Image to video: ${imageUrl}` : ''),
      scene: type,
      options: JSON.stringify({
        aspectRatio,
        quality,
        duration,
        promptExtend,
        shotType,
        audioUrl,
        imageUrl,
      }),
      status: result.taskStatus,
      costCredits,
      taskId: result.taskId,
      taskInfo: null,
      taskResult: null,
    };

    await createAITask(newAITask);

    return respData({
      success: true,
      provider: result.provider,
      taskId: result.taskId,
      status: result.taskStatus,
      costCredits,
      remainingCredits: remainingCredits - costCredits,
    });
  } catch (error: any) {
    console.error('Video generation failed:', error);
    return respErr(
      `Failed to create video generation task: ${buildErrorMessage(error)}`
    );
  }
}
