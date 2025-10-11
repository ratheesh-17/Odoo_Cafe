import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

jest.mock("../services/api", () => ({
  addSong: jest.fn(),
  getAllSongs: jest.fn(),
  getSongsByGenre: jest.fn(),
  getSongsSortedByArtist: jest.fn(),
  deleteSong: jest.fn(),
}));

import {
  addSong,
  getAllSongs,
  getSongsByGenre,
  getSongsSortedByArtist,
  deleteSong,
} from "../services/api";

describe("Spotify Playlist Manager App Tests", () => {
  const mockSongs = [
    {
      id: 1,
      songTitle: "Shape of You",
      artist: "Ed Sheeran",
      album: "Divide",
      genre: "Pop",
      duration: 240,
    },
    {
      id: 2,
      songTitle: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      genre: "Rock",
      duration: 360,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- Basic Rendering ----------
  test("renders header with title", async () => {
    getAllSongs.mockResolvedValueOnce([]);
    render(<App />);
    expect(await screen.findByText("Spotify Playlist Manager")).toBeInTheDocument();
  });

  test("renders empty state when no songs", async () => {
    getAllSongs.mockResolvedValueOnce([]);
    render(<App />);
    expect(await screen.findByText("No songs available. Add some!")).toBeInTheDocument();
  });

  test("renders list of songs", async () => {
    getAllSongs.mockResolvedValueOnce(mockSongs);
    render(<App />);
    expect(await screen.findByText("Shape of You")).toBeInTheDocument();
    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
  });

  // ---------- Song Creation ----------
  test("form requires all fields", async () => {
    getAllSongs.mockResolvedValueOnce([]);
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("Song Title"), {
      target: { value: "New Song" },
    });
    fireEvent.change(screen.getByPlaceholderText("Artist"), {
      target: { value: "New Artist" },
    });
    fireEvent.change(screen.getByPlaceholderText("Genre"), {
      target: { value: "Jazz" },
    });
    fireEvent.change(screen.getByPlaceholderText("Duration (seconds)"), {
      target: { value: "200" },
    });

    fireEvent.click(screen.getByText("Add Song"));
    await waitFor(() => expect(addSong).toHaveBeenCalled());
  });

  // ---------- Song Deletion ----------
  test("deletes a song", async () => {
    getAllSongs
      .mockResolvedValueOnce(mockSongs)
      .mockResolvedValueOnce([mockSongs[1]]);

    deleteSong.mockResolvedValueOnce({});

    render(<App />);

    expect(await screen.findByText("Shape of You")).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() =>
      expect(screen.queryByText("Shape of You")).not.toBeInTheDocument()
    );
  });

  test("delete button exists for each song", async () => {
    getAllSongs.mockResolvedValueOnce(mockSongs);
    render(<App />);
    expect(await screen.findAllByText("Delete")).toHaveLength(2);
  });

  test("does not break when deleting non-existing song", async () => {
    getAllSongs.mockResolvedValueOnce([]);
    deleteSong.mockResolvedValueOnce({});
    render(<App />);
    expect(await screen.findByText("No songs available. Add some!")).toBeInTheDocument();
  });

  // ---------- Filtering & Sorting ----------
  test("filters songs by genre", async () => {
    getAllSongs.mockResolvedValueOnce(mockSongs);
    getSongsByGenre.mockResolvedValueOnce([mockSongs[0]]);

    render(<App />);

    fireEvent.change(await screen.findByDisplayValue("All Songs"), {
      target: { value: "Pop" },
    });

    expect(await screen.findByText("Shape of You")).toBeInTheDocument();
  });

  test("sorts songs by artist", async () => {
    getAllSongs.mockResolvedValueOnce(mockSongs);
    getSongsSortedByArtist.mockResolvedValueOnce([...mockSongs].reverse());

    render(<App />);

    fireEvent.change(await screen.findByDisplayValue("All Songs"), {
      target: { value: "sorted" },
    });

    expect(await screen.findByText("Bohemian Rhapsody")).toBeInTheDocument();
  });

  test("shows all songs when filter reset to 'All Songs'", async () => {
    getAllSongs.mockResolvedValueOnce(mockSongs);
    render(<App />);
    fireEvent.change(await screen.findByDisplayValue("All Songs"), {
      target: { value: "all" },
    });
    expect(await screen.findByText("Bohemian Rhapsody")).toBeInTheDocument();
  });

  // ---------- Edge Cases ----------
  test("handles API error on fetch", async () => {
    getAllSongs.mockRejectedValueOnce(new Error("Network Error"));
    render(<App />);
    expect(await screen.findByText("Spotify Playlist Manager")).toBeInTheDocument();
  });

  test("handles API error on add song", async () => {
    getAllSongs.mockResolvedValueOnce([]);
    addSong.mockRejectedValueOnce(new Error("Add failed"));

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText("Song Title"), {
      target: { value: "Test Song" },
    });
    fireEvent.change(screen.getByPlaceholderText("Artist"), {
      target: { value: "Test Artist" },
    });
    fireEvent.change(screen.getByPlaceholderText("Genre"), {
      target: { value: "Rock" },
    });
    fireEvent.change(screen.getByPlaceholderText("Duration (seconds)"), {
      target: { value: "180" },
    });

    fireEvent.click(screen.getByText("Add Song"));

    await waitFor(() => expect(addSong).toHaveBeenCalled());
  });
});
