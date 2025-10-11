package com.examly.springapp.service;

import com.examly.springapp.exception.SongNotFoundException;
import com.examly.springapp.model.Song;
import com.examly.springapp.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SongService {
    
    private static final Logger log = LoggerFactory.getLogger(SongService.class);

    private final SongRepository songRepository;

    @Transactional
    public Song saveSong(Song song) {
        log.info("Saving song: {}", song.getTitle());
        return songRepository.save(song);
    }

    public List<Song> getAllSongs() {
        log.info("Retrieving all songs");
        return songRepository.findAll();
    }

    public List<Song> getSongsByGenre(String genre) {
        log.info("Retrieving songs by genre: {}", genre);
        return songRepository.findByGenre(genre);
    }

    public List<Song> getSongsSortedByArtist() {
        log.info("Retrieving songs sorted by artist");
        return songRepository.findAllByOrderByArtistAsc();
    }

    public Song getSongById(Long id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new SongNotFoundException("Song with id " + id + " not found"));
    }

    @Transactional
    public void deleteSong(Long id) {
        log.info("Deleting song with ID: {}", id);
        if (!songRepository.existsById(id)) {
            throw new SongNotFoundException("Song with id " + id + " not found");
        }
        songRepository.deleteById(id);
    }

    public List<Song> searchSongs(String query) {
        log.info("Searching songs with query: {}", query);
        return songRepository.findByTitleContainingIgnoreCase(query);
    }
}