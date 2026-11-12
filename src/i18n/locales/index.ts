import { en } from './en';
import { ru } from './ru';

export const dictionaries = { ru, en } as const;
export type MessageKey = keyof typeof ru;
export { en, ru };
