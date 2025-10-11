import { calculatePagination, generatePageNumbers, formatPaginationText } from '../utils/pagination';

describe('Pagination Utilities', () => {
  describe('calculatePagination', () => {
    test('calculates pagination for normal data', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 1, 6);
      
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.items).toHaveLength(6);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.startItem).toBe(1);
      expect(result.endItem).toBe(6);
    });

    test('calculates pagination for last page', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const result = calculatePagination(items, 5, 6);
      
      expect(result.currentPage).toBe(5);
      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
      expect(result.startItem).toBe(25);
      expect(result.endItem).toBe(25);
    });

    test('handles empty data', () => {
      const result = calculatePagination([], 1, 6);
      
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.items).toHaveLength(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.startItem).toBe(0);
      expect(result.endItem).toBe(0);
    });

    test('handles invalid page numbers', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      
      // Page too high
      const result1 = calculatePagination(items, 10, 6);
      expect(result1.currentPage).toBe(2); // Should be clamped to max page
      
      // Page too low
      const result2 = calculatePagination(items, -1, 6);
      expect(result2.currentPage).toBe(1); // Should be clamped to min page
    });
  });

  describe('generatePageNumbers', () => {
    test('generates all pages when total is less than max visible', () => {
      const result = generatePageNumbers(2, 4, 5);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('generates centered pages when possible', () => {
      const result = generatePageNumbers(5, 10, 5);
      expect(result).toEqual([3, 4, 5, 6, 7]);
    });

    test('generates pages at beginning', () => {
      const result = generatePageNumbers(2, 10, 5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('generates pages at end', () => {
      const result = generatePageNumbers(9, 10, 5);
      expect(result).toEqual([6, 7, 8, 9, 10]);
    });
  });

  describe('formatPaginationText', () => {
    test('formats normal pagination text', () => {
      const result = formatPaginationText(1, 6, 25);
      expect(result).toBe('Showing 1 to 6 of 25 items');
    });

    test('formats text for empty results', () => {
      const result = formatPaginationText(0, 0, 0);
      expect(result).toBe('No items to display');
    });

    test('formats text for single item', () => {
      const result = formatPaginationText(1, 1, 1);
      expect(result).toBe('Showing 1 to 1 of 1 items');
    });
  });
});

console.log('Pagination tests created successfully!');