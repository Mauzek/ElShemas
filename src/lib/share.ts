/**
 * Схема в ссылке. Документ сжимается и кодируется в хеш адреса —
 * хеш браузер на сервер не отправляет, поэтому схема никуда не уходит.
 */

import { deflateSync, inflateSync } from 'fflate';
import type { SchemaFile } from '../types/schema';
import { parseSchema, serializeSchema } from './fileIO';

/** Ссылки длиннее этого предела ломаются в мессенджерах и почте. */
export const MAX_URL_LENGTH = 8000;

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): Uint8Array => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/** Сжатая схема для хеша адреса. */
export function encodeDoc(doc: SchemaFile): string {
  const json = new TextEncoder().encode(serializeSchema(doc));
  return toBase64Url(deflateSync(json, { level: 9 }));
}

export interface ShareLink {
  url: string;
  /** Длина ссылки в символах. */
  length: number;
  /** Ссылка длиннее предела: такую лучше не отправлять. */
  tooLong: boolean;
}

export function buildShareUrl(doc: SchemaFile, viewOnly = false): ShareLink {
  const base = `${window.location.origin}${window.location.pathname}`;
  const url = `${base}${viewOnly ? '?view=1' : ''}#d=${encodeDoc(doc)}`;
  return { url, length: url.length, tooLong: url.length > MAX_URL_LENGTH };
}

/** Разбирает схему из хеша адреса. Возвращает null, если схемы там нет. */
export function readSharedDoc(hash: string): { doc: SchemaFile; warnings: string[] } | null {
  const match = /[#&]d=([A-Za-z0-9\-_]+)/.exec(hash);
  if (!match) return null;
  try {
    const json = new TextDecoder().decode(inflateSync(fromBase64Url(match[1])));
    const result = parseSchema(json);
    return result.ok ? { doc: result.doc, warnings: result.warnings } : null;
  } catch {
    return null;
  }
}

/** Убирает схему из адресной строки, не перезагружая страницу. */
export function clearShareHash(): void {
  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', clean || '/');
}

/**
 * Режим просмотра: панели скрыты, схему можно только смотреть.
 * Проверка на `window` нужна вне браузера — в юнит-тестах расчётного ядра.
 */
export function isViewOnly(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('view') === '1';
}
