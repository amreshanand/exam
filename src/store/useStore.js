import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      isDark: true,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),

      // ISS Data
      issPosition: null,
      issHistory: [],        // last 15 coords
      speedHistory: [],      // last 30 speeds
      lastFetchTime: null,
      isISSLoading: false,
      issError: null,

      setISSPosition: (pos) =>
        set((s) => {
          const history = [...s.issHistory, pos].slice(-15);
          return { issPosition: pos, issHistory: history, lastFetchTime: Date.now() };
        }),

      addSpeedEntry: (entry) =>
        set((s) => ({
          speedHistory: [...s.speedHistory, entry].slice(-30),
        })),

      setISSLoading: (v) => set({ isISSLoading: v }),
      setISSError: (e) => set({ issError: e }),

      // Astronauts
      astronauts: null,
      isAstronautsLoading: false,
      setAstronauts: (a) => set({ astronauts: a }),
      setAstronautsLoading: (v) => set({ isAstronautsLoading: v }),

      // News
      articles: [],
      newsSearch: '',
      newsSort: 'date',
      newsCategory: 'all',
      newsLastFetched: null,
      isNewsLoading: false,
      newsError: null,
      newsPage: 1,

      setArticles: (articles) => set({ articles, newsLastFetched: Date.now() }),
      setNewsSearch: (q) => set({ newsSearch: q }),
      setNewsSort: (s) => set({ newsSort: s }),
      setNewsCategory: (c) => set({ newsCategory: c }),
      setNewsLoading: (v) => set({ isNewsLoading: v }),
      setNewsError: (e) => set({ newsError: e }),
      setNewsPage: (p) => set({ newsPage: p }),

      getFilteredArticles: () => {
        const { articles, newsSearch, newsSort, newsCategory } = get();
        let filtered = [...articles];
        if (newsSearch) {
          const q = newsSearch.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.description?.toLowerCase().includes(q)
          );
        }
        if (newsCategory !== 'all') {
          filtered = filtered.filter(
            (a) => a.source?.name?.toLowerCase().includes(newsCategory.toLowerCase())
          );
        }
        if (newsSort === 'date') {
          filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        } else if (newsSort === 'source') {
          filtered.sort((a, b) => (a.source?.name || '').localeCompare(b.source?.name || ''));
        }
        return filtered;
      },

      // AI Chat
      chatMessages: [],
      isChatOpen: false,
      isChatLoading: false,

      toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
      addMessage: (msg) =>
        set((s) => ({
          chatMessages: [...s.chatMessages, msg].slice(-30),
        })),
      clearChat: () => set({ chatMessages: [] }),
      setChatLoading: (v) => set({ isChatLoading: v }),
    }),
    {
      name: 'iss-dashboard-store',
      partialize: (s) => ({
        isDark: s.isDark,
        issHistory: s.issHistory,
        speedHistory: s.speedHistory,
        articles: s.articles,
        newsLastFetched: s.newsLastFetched,
        chatMessages: s.chatMessages,
      }),
    }
  )
);
