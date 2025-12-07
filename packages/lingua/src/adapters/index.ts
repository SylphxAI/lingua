/**
 * Translation adapters for @sylphx/lingua
 *
 * @example
 * import { OpenRouterAdapter } from '@sylphx/lingua/adapters';
 *
 * const translator = new OpenRouterAdapter({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 * });
 */

export type { OpenRouterAdapterOptions } from './openrouter';
export { OpenRouterAdapter } from './openrouter';
