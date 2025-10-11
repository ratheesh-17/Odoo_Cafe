package com.examly.springapp.controller;

import com.examly.springapp.model.Song;
import com.examly.springapp.service.SongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
@Tag(name = "Song Management", description = "Song/Track management operations")
@Slf4j
@RequiredArgsConstructor
public class SongController {
    
    private final SongService songService;

    @PostMapping("/addSong")
    @Operation(summary = "Add Song", description = "Add a new song/track to the system")
    @ApiResponse(responseCode = "201", description = "Song added successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> addSong(@Valid @RequestBody Song song) {
        try {
            log.info("Adding new song: {}", song.getTitle());
            Song saved = songService.saveSong(song);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "song", saved,
                "message", "Song added successfully"
            ));
        } catch (Exception e) {
            log.error("Error adding song: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to add song",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/allSongs")
    @Operation(summary = "Get All Songs", description = "Retrieve all songs/tracks")
    @ApiResponse(responseCode = "200", description = "Songs retrieved successfully")
    public ResponseEntity<List<Song>> getAllSongs() {
        try {
            List<Song> songs = songService.getAllSongs();
            return ResponseEntity.ok(songs);
        } catch (Exception e) {
            log.error("Error retrieving all songs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/byGenre")
    @Operation(summary = "Get Songs by Genre", description = "Retrieve songs filtered by genre")
    @ApiResponse(responseCode = "200", description = "Songs retrieved successfully")
    public ResponseEntity<List<Song>> getByGenre(@RequestParam String genre) {
        try {
            log.info("Retrieving songs by genre: {}", genre);
            List<Song> songs = songService.getSongsByGenre(genre);
            return ResponseEntity.ok(songs);
        } catch (Exception e) {
            log.error("Error retrieving songs by genre {}: {}", genre, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/sortedByArtist")
    @Operation(summary = "Get Songs Sorted by Artist", description = "Retrieve songs sorted by artist name")
    @ApiResponse(responseCode = "200", description = "Songs retrieved successfully")
    public ResponseEntity<List<Song>> sortedByArtist() {
        try {
            List<Song> songs = songService.getSongsSortedByArtist();
            return ResponseEntity.ok(songs);
        } catch (Exception e) {
            log.error("Error retrieving songs sorted by artist: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/artist/upload")
    @Operation(summary = "Artist Upload Song", description = "Artists upload their original songs")
    @ApiResponse(responseCode = "201", description = "Song uploaded successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @PreAuthorize("hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> artistUploadSong(@Valid @RequestBody Song song) {
        try {
            log.info("Artist uploading new song: {}", song.getTitle());
            Song saved = songService.saveSong(song);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "song", saved,
                "message", "Song uploaded successfully"
            ));
        } catch (Exception e) {
            log.error("Error uploading song: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to upload song",
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Song", description = "Delete a song/track by ID")
    @ApiResponse(responseCode = "204", description = "Song deleted successfully")
    @ApiResponse(responseCode = "404", description = "Song not found")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteSong(@PathVariable Long id) {
        try {
            log.info("Deleting song with ID: {}", id);
            songService.deleteSong(id);
            return ResponseEntity.noContent().build();
        } catch (com.examly.springapp.exception.SongNotFoundException e) {
            log.warn("Song not found for deletion: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "Song not found",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error deleting song {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to delete song",
                "message", e.getMessage(),
                "type", e.getClass().getSimpleName()
            ));
        }
    }
}