import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, History, Search, TrendingUp, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { matchesLocalSearchTerm, normalizeSearchValue } from '../../utils/localSearch';

export type GlobalSearchEntry = {
  id: string;
  title: string;
  href: string;
  icon?: LucideIcon;
  section?: string;
  subtitle?: string;
  keywords?: string[];
};

type GlobalSearchCommandProps = {
  entries: GlobalSearchEntry[];
};

const MAX_RESULTS = 12;
const MAX_RECENT_RESULTS = 6;
const MAX_FREQUENT_RESULTS = 6;
const MAX_SUGGESTED_RESULTS = 8;
const SEARCH_HISTORY_STORAGE_KEY = 'conectcrm_global_search_history_v1';
const MAX_HISTORY_ITEMS = 30;

type SearchHistoryItem = {
  href: string;
  title: string;
  section?: string;
  lastAccessedAt: number;
  accessCount: number;
};

type DisplayGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  entries: GlobalSearchEntry[];
};

const normalizePath = (value: string): string => {
  if (!value) {
    return '/';
  }

  if (value.length > 1 && value.endsWith('/')) {
    return value.slice(0, -1);
  }

  return value;
};

const getRootSegment = (value: string): string => {
  const normalizedValue = normalizePath(value);
  const [segment = ''] = normalizedValue.replace(/^\//, '').split('/');
  return segment.toLowerCase();
};

const resolveContextMatch = (
  entries: GlobalSearchEntry[],
  pathname: string,
): { section?: string; rootSegment: string } => {
  const normalizedPathname = normalizePath(pathname);
  const rootSegment = getRootSegment(normalizedPathname);
  const matchingEntry = [...entries]
    .filter((entry) => {
      const entryPath = normalizePath(entry.href);
      return normalizedPathname === entryPath || normalizedPathname.startsWith(`${entryPath}/`);
    })
    .sort((first, second) => normalizePath(second.href).length - normalizePath(first.href).length)[0];

  return {
    section: matchingEntry?.section,
    rootSegment,
  };
};

const normalizeForHighlight = (value: string): { normalized: string; map: number[] } => {
  const map: number[] = [];
  let normalized = '';

  for (let index = 0; index < value.length; index += 1) {
    const normalizedChunk = value[index]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    for (const chunkChar of normalizedChunk) {
      normalized += chunkChar;
      map.push(index);
    }
  }

  return { normalized, map };
};

const renderHighlightedText = (value: string, normalizedTerm: string): React.ReactNode => {
  if (!value || !normalizedTerm) {
    return value;
  }

  const { normalized, map } = normalizeForHighlight(value);
  const startIndex = normalized.indexOf(normalizedTerm);

  if (startIndex < 0) {
    return value;
  }

  const startOriginal = map[startIndex] ?? 0;
  const endOriginalIndex = map[startIndex + normalizedTerm.length - 1] ?? value.length - 1;
  const endOriginal = Math.min(endOriginalIndex + 1, value.length);

  return (
    <>
      {value.slice(0, startOriginal)}
      <mark className="rounded-sm bg-[#DDF2EA] px-0.5 text-[#0C6E69]">{value.slice(startOriginal, endOriginal)}</mark>
      {value.slice(endOriginal)}
    </>
  );
};

const GlobalSearchCommand: React.FC<GlobalSearchCommandProps> = ({ entries }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const normalizedCurrentPath = normalizePath(location.pathname);
  const contextMatch = useMemo(
    () => resolveContextMatch(entries, location.pathname),
    [entries, location.pathname],
  );
  const normalizedContextSection = normalizeSearchValue(contextMatch.section);

  const entriesByPath = useMemo(() => {
    return new Map(entries.map((entry) => [normalizePath(entry.href), entry]));
  }, [entries]);

  useEffect(() => {
    try {
      const rawValue = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

      const parsedValue = JSON.parse(rawValue) as SearchHistoryItem[];
      if (Array.isArray(parsedValue)) {
        setSearchHistory(parsedValue);
      }
    } catch {
      setSearchHistory([]);
    }
  }, []);

  const persistSearchHistory = useCallback((items: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem impacto funcional quando o storage falhar.
    }
  }, []);

  const filteredEntries = useMemo<GlobalSearchEntry[]>(() => {
    const safeEntries = entries.filter((entry) => Boolean(entry.href));

    if (!normalizedSearchTerm) {
      return [];
    }

    return safeEntries
      .filter((entry) =>
        matchesLocalSearchTerm(normalizedSearchTerm, [
          entry.title,
          entry.section,
          entry.subtitle,
          entry.href,
          ...(entry.keywords ?? []),
        ]),
      )
      .map((entry) => {
        const title = normalizeSearchValue(entry.title);
        const subtitle = normalizeSearchValue(entry.subtitle);
        const section = normalizeSearchValue(entry.section);
        const href = normalizeSearchValue(entry.href);
        const entryRootSegment = getRootSegment(entry.href);

        let score = 400;
        if (title.startsWith(normalizedSearchTerm)) {
          score = 0;
        } else if (title.includes(normalizedSearchTerm)) {
          score = 60;
        } else if (section.startsWith(normalizedSearchTerm)) {
          score = 90;
        } else if (subtitle.includes(normalizedSearchTerm)) {
          score = 110;
        } else if (href.includes(normalizedSearchTerm)) {
          score = 140;
        }

        if (normalizedContextSection && section === normalizedContextSection) {
          score -= 35;
        }

        if (entryRootSegment && entryRootSegment === contextMatch.rootSegment) {
          score -= 20;
        }

        return { entry, score };
      })
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.entry.title.localeCompare(b.entry.title, 'pt-BR', { sensitivity: 'base' }),
      )
      .slice(0, MAX_RESULTS)
      .map(({ entry }) => entry);
  }, [
    contextMatch.rootSegment,
    entries,
    normalizedContextSection,
    normalizedSearchTerm,
  ]);

  const displayGroups = useMemo<DisplayGroup[]>(() => {
    if (normalizedSearchTerm) {
      return [
        {
          id: 'results',
          label: 'Resultados',
          icon: Search,
          entries: filteredEntries,
        },
      ];
    }

    const recents = searchHistory
      .slice()
      .sort((first, second) => second.lastAccessedAt - first.lastAccessedAt)
      .map((historyEntry) => entriesByPath.get(normalizePath(historyEntry.href)))
      .filter((entry): entry is GlobalSearchEntry => Boolean(entry))
      .slice(0, MAX_RECENT_RESULTS);

    const recentPathSet = new Set(recents.map((entry) => normalizePath(entry.href)));

    const frequents = searchHistory
      .slice()
      .sort(
        (first, second) =>
          second.accessCount - first.accessCount || second.lastAccessedAt - first.lastAccessedAt,
      )
      .map((historyEntry) => entriesByPath.get(normalizePath(historyEntry.href)))
      .filter((entry): entry is GlobalSearchEntry => Boolean(entry))
      .filter((entry) => !recentPathSet.has(normalizePath(entry.href)))
      .slice(0, MAX_FREQUENT_RESULTS);

    const groups: DisplayGroup[] = [];

    if (recents.length > 0) {
      groups.push({
        id: 'recent',
        label: 'Recentes',
        icon: History,
        entries: recents,
      });
    }

    if (frequents.length > 0) {
      groups.push({
        id: 'frequent',
        label: 'Frequentes',
        icon: TrendingUp,
        entries: frequents,
      });
    }

    if (groups.length === 0) {
      const suggested = [...entries]
        .sort((first, second) => {
          const firstSection = normalizeSearchValue(first.section);
          const secondSection = normalizeSearchValue(second.section);
          const firstRoot = getRootSegment(first.href);
          const secondRoot = getRootSegment(second.href);

          const firstContextScore =
            Number(firstSection === normalizedContextSection) * 2 +
            Number(firstRoot === contextMatch.rootSegment);
          const secondContextScore =
            Number(secondSection === normalizedContextSection) * 2 +
            Number(secondRoot === contextMatch.rootSegment);

          if (firstContextScore !== secondContextScore) {
            return secondContextScore - firstContextScore;
          }

          return first.title.localeCompare(second.title, 'pt-BR', { sensitivity: 'base' });
        })
        .slice(0, MAX_SUGGESTED_RESULTS);

      groups.push({
        id: 'suggested',
        label: 'Sugeridos',
        icon: Search,
        entries: suggested,
      });
    }

    return groups;
  }, [
    contextMatch.rootSegment,
    entries,
    entriesByPath,
    filteredEntries,
    normalizedContextSection,
    normalizedSearchTerm,
    searchHistory,
  ]);

  const displayGroupsWithOffsets = useMemo(() => {
    let offset = 0;
    return displayGroups.map((group) => {
      const groupWithOffset = { ...group, startIndex: offset };
      offset += group.entries.length;
      return groupWithOffset;
    });
  }, [displayGroups]);

  const displayEntries = useMemo(
    () => displayGroups.flatMap((group) => group.entries),
    [displayGroups],
  );

  const closeCommand = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(0);
  }, []);

  const openCommand = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleSelectEntry = useCallback(
    (entry: GlobalSearchEntry) => {
      const now = Date.now();
      setSearchHistory((previousValue) => {
        const normalizedHref = normalizePath(entry.href);
        const existingEntry = previousValue.find(
          (historyEntry) => normalizePath(historyEntry.href) === normalizedHref,
        );

        const nextValue = existingEntry
          ? previousValue
              .map((historyEntry) =>
                normalizePath(historyEntry.href) === normalizedHref
                  ? {
                      ...historyEntry,
                      title: entry.title,
                      section: entry.section,
                      lastAccessedAt: now,
                      accessCount: historyEntry.accessCount + 1,
                    }
                  : historyEntry,
              )
              .sort((first, second) => second.lastAccessedAt - first.lastAccessedAt)
          : [
              {
                href: entry.href,
                title: entry.title,
                section: entry.section,
                lastAccessedAt: now,
                accessCount: 1,
              },
              ...previousValue,
            ]
              .sort((first, second) => second.lastAccessedAt - first.lastAccessedAt)
              .slice(0, MAX_HISTORY_ITEMS);

        persistSearchHistory(nextValue);
        return nextValue;
      });

      closeCommand();
      navigate(entry.href);
    },
    [closeCommand, navigate, persistSearchHistory],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const isOpenShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isOpenShortcut) {
        event.preventDefault();
        openCommand();
        return;
      }

      if (isOpen && event.key === 'Escape') {
        event.preventDefault();
        closeCommand();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [closeCommand, isOpen, openCommand]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [isOpen, normalizedSearchTerm]);

  useEffect(() => {
    if (!isOpen || displayEntries.length === 0) {
      return;
    }

    const matchedIndex = displayEntries.findIndex(
      (entry) => normalizePath(entry.href) === normalizedCurrentPath,
    );

    if (matchedIndex >= 0) {
      setSelectedIndex(matchedIndex);
    }
  }, [displayEntries, isOpen, normalizedCurrentPath]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(displayEntries.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedEntry = displayEntries[selectedIndex];
      if (selectedEntry) {
        handleSelectEntry(selectedEntry);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommand();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openCommand}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4E2E7] bg-white text-[#4B6775] transition-colors hover:bg-[#F4FAFC]"
        aria-label="Buscar no sistema (Ctrl/Cmd + K)"
        title="Buscar no sistema (Ctrl/Cmd + K)"
      >
        <Search className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-[#062C3B]/38 p-3 pt-16 sm:p-5 sm:pt-20"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCommand();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#D3E2E7] bg-white shadow-[0_34px_78px_-40px_rgba(6,39,54,0.88)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#E3ECEF] px-3 py-3 sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-[#5C7886]" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar páginas, módulos ou rotas..."
                className="h-10 w-full border-none bg-transparent text-sm text-[#244455] outline-none placeholder:text-[#7C96A3]"
              />
              <button
                type="button"
                onClick={closeCommand}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6F8A97] transition-colors hover:bg-[#F3F8FA]"
                aria-label="Fechar busca global"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[56vh] overflow-y-auto p-2 sm:p-3">
              {displayEntries.length === 0 ? (
                <div className="rounded-xl border border-[#DFE9ED] bg-[#F8FBFC] px-4 py-8 text-center text-sm text-[#64808D]">
                  Nenhum resultado encontrado para sua busca.
                </div>
              ) : (
                <div className="space-y-3">
                  {displayGroupsWithOffsets.map((group) => {
                    const GroupIcon = group.icon;

                    return (
                      <section key={group.id}>
                        <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[#6A8794]">
                          <GroupIcon className="h-3.5 w-3.5" />
                          {group.label}
                        </div>
                        <div className="space-y-1.5">
                          {group.entries.map((entry, index) => {
                            const absoluteIndex = group.startIndex + index;
                            const Icon = entry.icon;
                            const isSelected = absoluteIndex === selectedIndex;
                            const isCurrentRoute = normalizePath(entry.href) === normalizedCurrentPath;
                            const breadcrumbBase =
                              entry.subtitle && entry.subtitle.trim().length > 0
                                ? `${entry.subtitle} › ${entry.title}`
                                : `${entry.section ?? 'Sistema'} › ${entry.title}`;

                            return (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() => handleSelectEntry(entry)}
                                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                  isSelected
                                    ? 'border-[#9FD4C7] bg-[#EEF8F4]'
                                    : 'border-transparent bg-white hover:border-[#D9E6EB] hover:bg-[#F8FBFD]'
                                }`}
                              >
                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D7E4E8] bg-white text-[#4E6876]">
                                  {Icon ? <Icon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-[#204152]">
                                    {renderHighlightedText(entry.title, normalizedSearchTerm)}
                                  </span>
                                  <span className="block truncate text-xs text-[#678391]">
                                    {renderHighlightedText(breadcrumbBase, normalizedSearchTerm)}
                                  </span>
                                  <span className="block truncate text-[11px] text-[#8AA0AC]">
                                    {renderHighlightedText(entry.href, normalizedSearchTerm)}
                                  </span>
                                </span>

                                <span className="ml-auto inline-flex items-center gap-2">
                                  {isCurrentRoute ? (
                                    <span className="rounded-full border border-[#CFE3D9] bg-[#EDF8F4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0F7B7D]">
                                      Atual
                                    </span>
                                  ) : null}
                                  <ChevronRight className="h-4 w-4 text-[#8AA2AE]" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3ECEF] bg-[#FBFDFE] px-3 py-2 text-xs text-[#65818F] sm:px-4">
              <span>Use ↑ e ↓ para navegar</span>
              <span>Enter para abrir · Esc para fechar · Ctrl/Cmd + K para buscar</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default React.memo(GlobalSearchCommand);
