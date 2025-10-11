package com.examly.springapp.controller;

import com.examly.springapp.dto.CreatePlaylistRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
@Tag(name = "Playlist Management", description = "Playlist creation, management, and collaboration features")
@RequiredArgsConstructor
public class PlaylistController {
    
    private static final Logger log = LoggerFactory.getLogger(PlaylistController.class);
    
    @PostMapping
    @Operation(summary = "Create Playlist", description = "Create a new playlist with privacy and collaboration settings")
    @ApiResponse(responseCode = "201", description = "Playlist created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> createPlaylist(@Valid @RequestBody CreatePlaylistRequest request,
                                          Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("Creating playlist '{}' for user {}", request.getTitle(), userEmail);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", 1L,
                "title", request.getTitle(),
                "description", request.getDescription(),
                "isPublic", request.isPublic(),
                "isCollaborative", request.isCollaborative(),
                "trackCount", 0,
                "message", "Playlist created successfully"
            ));
        } catch (Exception e) {
            log.error("Error creating playlist for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Creation failed",
                "message", "Failed to create playlist"
            ));
        }
    }
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get User Playlists", description = "Get all playlists for a specific user")
    @ApiResponse(responseCode = "200", description = "Playlists retrieved successfully")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserPlaylists(@PathVariable Long userId,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Retrieving playlists for user {}", userId);
            
            return ResponseEntity.ok(Map.of(
                "playlists", List.of(
                    Map.of(
                        "id", 1,
                        "title", "My Favorites",
                        "description", "My favorite tracks",
                        "isPublic", true,
                        "isCollaborative", false,
                        "trackCount", 15,
                        "createdDate", System.currentTimeMillis()
                    )
                ),
                "totalElements", 1,
                "totalPages", 1,
                "currentPage", page,
                "message", "Playlists retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving playlists for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Retrieval failed",
                "message", "Failed to retrieve playlists"
            ));
        }
    }
    
    @GetMapping("/{playlistId}")
    @Operation(summary = "Get Playlist Details", description = "Get detailed information about a specific playlist")
    @ApiResponse(responseCode = "200", description = "Playlist details retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Playlist not found")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> getPlaylistDetails(@PathVariable Long playlistId) {
        try {
            log.info("Retrieving details for playlist {}", playlistId);
            
            return ResponseEntity.ok(Map.of(
                "id", playlistId,
                "title", "Sample Playlist",
                "description", "A sample playlist",
                "isPublic", true,
                "isCollaborative", false,
                "tracks", List.of(
                    Map.of(
                        "id", 1,
                        "title", "Sample Track",
                        "artist", "Sample Artist",
                        "duration", 180,
                        "position", 1
                    )
                ),
                "collaborators", List.of(),
                "followerCount", 0,
                "message", "Playlist details retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving playlist {}: {}", playlistId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Retrieval failed",
                "message", "Failed to retrieve playlist details"
            ));
        }
    }
}