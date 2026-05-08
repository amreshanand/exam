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

      // Initial state with baked-in data for instant loading
      issPosition: { message: 'success', iss_position: { latitude: '28.7041', longitude: '77.1025' }, timestamp: Date.now() },
      issHistory: [
        { message: 'success', iss_position: { latitude: '28.7000', longitude: '77.1000' }, timestamp: Date.now() - 60000 },
        { message: 'success', iss_position: { latitude: '28.7020', longitude: '77.1010' }, timestamp: Date.now() - 45000 },
        { message: 'success', iss_position: { latitude: '28.7041', longitude: '77.1025' }, timestamp: Date.now() - 30000 },
      ],
      speedHistory: Array.from({ length: 15 }).map((_, i) => ({ speed: 27600 + (Math.random() - 0.5) * 40, time: Date.now() - (14 - i) * 15000 })),
      lastFetchTime: Date.now(),

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

      // Initial Crew Manifest
      astronauts: {
        number: 6,
        people: [
          { name: 'A. Patel', craft: 'ISS', role: 'Commander' },
          { name: 'B. Kim', craft: 'ISS', role: 'Flight Engineer' },
          { name: 'C. Smith', craft: 'ISS', role: 'Mission Specialist' },
          { name: 'D. Lopez', craft: 'ISS', role: 'Payload Specialist' },
          { name: 'E. Novak', craft: 'ISS', role: 'Science Officer' },
          { name: 'F. Chen', craft: 'ISS', role: 'Systems Engineer' },
        ]
      },
      isAstronautsLoading: false,
      setAstronauts: (a) => set({ astronauts: a }),
      setAstronautsLoading: (v) => set({ isAstronautsLoading: v }),

      // Initial Intelligence Briefings
      articles: [
        { title: 'New Solar Observation from ISS', description: 'Scientists capture high-resolution images of solar activity.', url: 'https://example.com/article1', urlToImage: '', source: { name: 'SpaceNews' }, publishedAt: new Date().toISOString(), author: 'Jane Reporter' },
        { title: 'Supply Mission Successful', description: 'A cargo vehicle docked with the ISS delivering experiments.', url: 'https://example.com/article2', urlToImage: '', source: { name: 'OrbitalDaily' }, publishedAt: new Date().toISOString(), author: 'John Space' },
        { title: 'Astronauts Conduct Spacewalk', description: 'Maintenance work completed outside the station.', url: 'https://example.com/article3', urlToImage: '', source: { name: 'MissionLog' }, publishedAt: new Date().toISOString(), author: 'Alex Crew' },
        { title: 'New Experiment on Microgravity Effects', description: 'Results from a biology experiment show promising data.', url: 'https://example.com/article4', urlToImage: '', source: { name: 'LabNotes' }, publishedAt: new Date().toISOString(), author: 'Dr. K' },
        { title: 'International Collaboration Expands', description: 'Agreements signed for next year scientific payloads.', url: 'https://example.com/article5', urlToImage: '', source: { name: 'GlobalSpace' }, publishedAt: new Date().toISOString(), author: 'Reporter X' },
      ],
      newsSearch: '',
      newsSort: 'date',
      newsCategory: 'all',
      newsLastFetched: Date.now(),
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
        issPosition: s.issPosition,
        issHistory: s.issHistory,
        speedHistory: s.speedHistory,
        astronauts: s.astronauts,
        articles: s.articles,
        newsLastFetched: s.newsLastFetched,
        chatMessages: s.chatMessages,
      }),
    }
  )
);
