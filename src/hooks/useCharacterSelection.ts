import { useCallback, useEffect, useMemo, useState } from 'react';

import { CHARACTER_IDS, type CharacterId } from '@/constants/characters';
import { readPreference, writePreference } from '@/utils/preferences';

const STORAGE_KEY = 'chatCharacters';
const DEFAULT_ENABLED: Record<CharacterId, boolean> = { angry: true, sad: true, joy: true };

function normalizeSelection(value: unknown): Record<CharacterId, boolean> {
  if (!value || typeof value !== 'object') return DEFAULT_ENABLED;
  const saved = value as Partial<Record<CharacterId, unknown>>;
  const next = Object.fromEntries(CHARACTER_IDS.map((id) => [id, saved[id] === true])) as Record<CharacterId, boolean>;
  if (!CHARACTER_IDS.some((id) => next[id])) return DEFAULT_ENABLED;
  return next;
}

export function useCharacterSelection() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    readPreference(STORAGE_KEY, DEFAULT_ENABLED)
      .then((saved) => {
        if (active) setEnabled(normalizeSelection(saved));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded) void writePreference(STORAGE_KEY, enabled).catch(() => undefined);
  }, [enabled, loaded]);

  const toggle = useCallback((id: CharacterId) => {
    setEnabled((current) => {
      const enabledCount = CHARACTER_IDS.filter((characterId) => current[characterId]).length;
      if (current[id] && enabledCount === 1) return current;
      return { ...current, [id]: !current[id] };
    });
  }, []);

  const characterKeys = useMemo(() => CHARACTER_IDS.filter((id) => enabled[id]), [enabled]);
  return { enabled, toggle, characterKeys, loaded };
}
