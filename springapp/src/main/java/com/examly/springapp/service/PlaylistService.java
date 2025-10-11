package com.examly.springapp.service;

import com.examly.springapp.exception.PlaylistNotFoundException;
import com.examly.springapp.model.Playlist;
import com.examly.springapp.repository.PlaylistRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaylistService {
    
    private static final Logger log = LoggerFactory.getLogger(PlaylistService.class);

    private final PlaylistRepository playlistRepository;

    @Transactional
    public Playlist createPlaylist(Playlist playlist) {
        log.info("Creating playlist: {}", playlist.getTitle());
        return playlistRepository.save(playlist);
    }

    public List<Playlist> getUserPlaylists(Long userId) {
        log.info("Retrieving playlists for user: {}", userId);
        return playlistRepository.findByUserId(userId);
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new PlaylistNotFoundException("Playlist with id " + id + " not found"));
    }

    public List<Playlist> getPublicPlaylists() {
        log.info("Retrieving public playlists");
        return playlistRepository.findByIsPublicTrueOrderByFollowerCountDesc();
    }

    @Transactional
    public void deletePlaylist(Long id) {
        log.info("Deleting playlist with ID: {}", id);
        if (!playlistRepository.existsById(id)) {
            throw new PlaylistNotFoundException("Playlist with id " + id + " not found");
        }
        playlistRepository.deleteById(id);
    }

    public List<Playlist> searchPlaylists(String query) {
        log.info("Searching playlists with query: {}", query);
        return playlistRepository.findByTitleContainingIgnoreCase(query);
    }
}