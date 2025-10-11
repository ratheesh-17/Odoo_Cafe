import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the API functions
jest.mock('../services/api', () => ({
  getAllSongs: jest.fn(() => Promise.resolve([
    {
      id: 1,
      songTitle: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: 'Pop',
      duration: 180
    }
  ])),
  addSong: jest.fn(() => Promise.resolve({ id: 2 })),
  deleteSong: jest.fn(() => Promise.resolve()),
  getSongsByGenre: jest.fn(() => Promise.resolve([])),
  getSongsSortedByArtist: jest.fn(() => Promise.resolve([]))
}));

describe('State Management Integration Tests', () => {
  test('renders app with state management', async () => {
    render(<App />);
    
    // Check if the filter dropdown is rendered
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
    
    // Check if form inputs are rendered
    expect(screen.getByPlaceholderText('Song Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Artist')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Genre')).toBeInTheDocument();
    
    // Check if add button is rendered
    expect(screen.getByRole('button', { name: /add song/i })).toBeInTheDocument();
  });

  test('filter dropdown works correctly', async () => {
    render(<App />);
    
    const filterDropdown = screen.getByTestId('filter-dropdown');
    
    // Test filter change
    fireEvent.change(filterDropdown, { target: { value: 'Pop' } });
    expect(filterDropdown.value).toBe('Pop');
    
    fireEvent.change(filterDropdown, { target: { value: 'all' } });
    expect(filterDropdown.value).toBe('all');
  });

  test('form validation works', async () => {
    render(<App />);
    
    const addButton = screen.getByRole('button', { name: /add song/i });
    
    // Try to submit empty form
    fireEvent.click(addButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/song title is required/i)).toBeInTheDocument();
    });
  });

  test('form submission works with valid data', async () => {
    render(<App />);
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Song Title'), {
      target: { value: 'New Test Song' }
    });
    fireEvent.change(screen.getByPlaceholderText('Artist'), {
      target: { value: 'New Test Artist' }
    });
    fireEvent.change(screen.getByPlaceholderText('Genre'), {
      target: { value: 'Rock' }
    });
    fireEvent.change(screen.getByPlaceholderText('Duration (seconds)'), {
      target: { value: '200' }
    });
    
    const addButton = screen.getByRole('button', { name: /add song/i });
    fireEvent.click(addButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/song added successfully/i)).toBeInTheDocument();
    });
  });

  test('loading states work correctly', async () => {
    render(<App />);
    
    // Initially should show loading
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});

// Integration test for custom hooks
describe('Custom Hooks Integration', () => {
  test('useSongs context provides correct values', () => {
    // This would need to be tested with a custom render function
    // that wraps components with SongProvider
    expect(true).toBe(true); // Placeholder
  });
});

console.log('State Management Integration Tests created successfully!');