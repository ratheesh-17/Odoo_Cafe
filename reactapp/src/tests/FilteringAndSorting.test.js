import { applySongFilters, applySongSort, formatDuration, createFilterSummary } from '../utils/filtering';

const mockSongs = [
  {
    id: 1,
    songTitle: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    genre: 'Rock',
    duration: 355
  },
  {
    id: 2,
    songTitle: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    genre: 'Pop',
    duration: 294
  },
  {
    id: 3,
    songTitle: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    genre: 'Rock',
    duration: 482
  },
  {
    id: 4,
    songTitle: 'Shape of You',
    artist: 'Ed Sheeran',
    album: 'Divide',
    genre: 'Pop',
    duration: 233
  },
];

describe('Filtering and Sorting Utilities', () => {
  describe('applySongFilters', () => {
    test('filters songs by genre', () => {
      const filters = { genre: 'Rock' };
      const result = applySongFilters(mockSongs, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(song => song.genre === 'Rock')).toBe(true);
    });

    test('filters songs by search query', () => {
      const filters = { searchQuery: 'billie' };
      const result = applySongFilters(mockSongs, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].songTitle).toBe('Billie Jean');
    });

    test('filters songs by duration range', () => {
      const filters = { minDuration: 300, maxDuration: 400 };
      const result = applySongFilters(mockSongs, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].songTitle).toBe('Bohemian Rhapsody');
    });

    test('combines multiple filters', () => {
      const filters = { genre: 'Pop', searchQuery: 'ed' };
      const result = applySongFilters(mockSongs, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].artist).toBe('Ed Sheeran');
    });

    test('returns all songs when no filters applied', () => {
      const filters = { genre: 'all' };
      const result = applySongFilters(mockSongs, filters);
      
      expect(result).toHaveLength(mockSongs.length);
    });
  });

  describe('applySongSort', () => {
    test('sorts songs by title ascending', () => {
      const result = applySongSort(mockSongs, 'title_asc');
      
      expect(result[0].songTitle).toBe('Billie Jean');
      expect(result[result.length - 1].songTitle).toBe('Stairway to Heaven');
    });

    test('sorts songs by title descending', () => {
      const result = applySongSort(mockSongs, 'title_desc');
      
      expect(result[0].songTitle).toBe('Stairway to Heaven');
      expect(result[result.length - 1].songTitle).toBe('Billie Jean');
    });

    test('sorts songs by artist ascending', () => {
      const result = applySongSort(mockSongs, 'artist_asc');
      
      expect(result[0].artist).toBe('Ed Sheeran');
      expect(result[result.length - 1].artist).toBe('Queen');
    });

    test('sorts songs by duration ascending', () => {
      const result = applySongSort(mockSongs, 'duration_asc');
      
      expect(result[0].duration).toBe(233);
      expect(result[result.length - 1].duration).toBe(482);
    });

    test('sorts songs by duration descending', () => {
      const result = applySongSort(mockSongs, 'duration_desc');
      
      expect(result[0].duration).toBe(482);
      expect(result[result.length - 1].duration).toBe(233);
    });

    test('returns original order for default sort', () => {
      const result = applySongSort(mockSongs, 'default');
      
      expect(result).toEqual(mockSongs);
    });
  });

  describe('formatDuration', () => {
    test('formats seconds to mm:ss format', () => {
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(45)).toBe('0:45');
    });

    test('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(3600)).toBe('1:00:00');
    });

    test('handles edge cases', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
      expect(formatDuration(-10)).toBe('0:00');
    });
  });

  describe('createFilterSummary', () => {
    test('creates summary for active filters', () => {
      const filters = { genre: 'Rock', searchQuery: 'queen' };
      const result = createFilterSummary(filters, 1);
      
      expect(result).toContain('1 songs found');
      expect(result).toContain('Genre: Rock');
      expect(result).toContain('Search: "queen"');
    });

    test('creates summary for no filters', () => {
      const filters = { genre: 'all' };
      const result = createFilterSummary(filters, 25);
      
      expect(result).toBe('Showing all 25 songs');
    });

    test('includes duration range in summary', () => {
      const filters = { minDuration: 120, maxDuration: 300 };
      const result = createFilterSummary(filters, 5);
      
      expect(result).toContain('Duration: 2:00 - 5:00');
    });
  });
});

console.log('Filtering and sorting tests created successfully!');