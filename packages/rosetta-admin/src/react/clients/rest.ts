'use client';

/**
 * REST client adapter for translation admin
 *
 * @example
 * ```tsx
 * import { createRestClient } from '@sylphx/rosetta-admin/react';
 *
 * const client = createRestClient({ baseUrl: '/api/admin/translations' });
 *
 * export default function Page() {
 *   return (
 *     <TranslationAdminProvider client={client}>
 *       <MyTranslationUI />
 *     </TranslationAdminProvider>
 *   );
 * }
 * ```
 */

import type {
	AdminAPIClient,
	BatchTranslateRequest,
	BatchTranslateResponse,
	FetchTranslationsResponse,
	MarkAsReviewedRequest,
	SaveTranslationRequest,
} from '../../core/types';

export interface RestClientOptions {
	/** Base URL for the API (e.g., '/api/admin/translations') */
	baseUrl: string;
	/** Custom fetch function (optional, for adding auth headers etc.) */
	fetch?: typeof fetch;
}

/**
 * Create an API client using REST endpoints
 */
export function createRestClient(options: RestClientOptions): AdminAPIClient {
	const { baseUrl, fetch: customFetch = fetch } = options;

	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		const url = path ? `${baseUrl}${path}` : baseUrl;
		const response = await customFetch(url, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...init?.headers,
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || 'Request failed');
		}

		return response.json();
	}

	return {
		async fetchTranslations(): Promise<FetchTranslationsResponse> {
			return request('');
		},

		async saveTranslation(data: SaveTranslationRequest): Promise<void> {
			await request('', {
				method: 'PUT',
				body: JSON.stringify(data),
			});
		},

		async markAsReviewed(data: MarkAsReviewedRequest): Promise<void> {
			await request('', {
				method: 'PATCH',
				body: JSON.stringify(data),
			});
		},

		async batchTranslate(data: BatchTranslateRequest): Promise<BatchTranslateResponse> {
			return request('/batch', {
				method: 'POST',
				body: JSON.stringify(data),
			});
		},

		async addLocale(locale: string): Promise<void> {
			await request('/locales', {
				method: 'POST',
				body: JSON.stringify({ locale }),
			});
		},

		async removeLocale(locale: string): Promise<void> {
			await request('/locales', {
				method: 'DELETE',
				body: JSON.stringify({ locale }),
			});
		},
	};
}
