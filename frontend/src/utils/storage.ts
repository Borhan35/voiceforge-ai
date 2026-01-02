import { get, set } from 'idb-keyval';
import type { GeneratedAudio } from '../types';

const HISTORY_KEY = 'generated_history';
const MAX_HISTORY_ITEMS = 20;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const storage = {
    async getHistory(): Promise<GeneratedAudio[]> {
        try {
            const history = (await get<GeneratedAudio[]>(HISTORY_KEY)) || [];
            const now = Date.now();

            // Filter out items older than 7 days
            const validHistory = history.filter(item => {
                // If no timestamp, keep it (legacy) or discard? Let's keep and add now if needed, 
                // but for safety, if it lacks checking, we might just assume it's new enough or discard.
                // The type definition has timestamp.
                if (!item.timestamp) return true;
                return (now - item.timestamp) < SEVEN_DAYS_MS;
            });

            // If we filtered anything out, update storage
            if (validHistory.length !== history.length) {
                await set(HISTORY_KEY, validHistory);
            }

            return validHistory;
        } catch (error) {
            console.error('Failed to load history from storage:', error);
            return [];
        }
    },

    async addHistoryItem(item: GeneratedAudio): Promise<GeneratedAudio[]> {
        try {
            const history = await this.getHistory(); // Gets cleaned history
            const newHistory = [item, ...history].slice(0, MAX_HISTORY_ITEMS);
            await set(HISTORY_KEY, newHistory);
            return newHistory;
        } catch (error) {
            console.error('Failed to save history item:', error);
            throw error;
        }
    },

    async deleteHistoryItem(id: string): Promise<GeneratedAudio[]> {
        try {
            const history = await this.getHistory();
            const newHistory = history.filter(item => item.id !== id);
            await set(HISTORY_KEY, newHistory);
            return newHistory;
        } catch (error) {
            console.error('Failed to delete history item:', error);
            throw error;
        }
    },

    async clearHistory(): Promise<void> {
        try {
            await set(HISTORY_KEY, []);
        } catch (error) {
            console.error('Failed to clear history:', error);
            throw error;
        }
    }
};
