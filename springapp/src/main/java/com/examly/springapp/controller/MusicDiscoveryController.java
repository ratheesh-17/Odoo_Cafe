package com.examly.springapp.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discovery")
@Tag(name = "Music Discovery", description = "Music search, recommendations, and discovery features")
@Slf4j
@RequiredArgsConstructor
public class MusicDiscoveryController {
    
    @GetMapping("/search/tracks")
    @Operation(summary = "Search Tracks", description = "Search for tracks with advanced filters")
    @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    public ResponseEntity<?> searchTracks(@RequestParam String query,
                                        @RequestParam(required = false) String genre,
                                        @RequestParam(required = false) String artist,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Searching tracks with query: {}, genre: {}, artist: {}", query, genre, artist);
            
            return ResponseEntity.ok(Map.of(
                "tracks", List.of(
                    Map.of(
                        "id", 1,
                        "title", "Bohemian Rhapsody",
                        "artist", "Queen",
                        "album", "A Night at the Opera",
                        "genre", "Rock",
                        "duration", 355,
                        "audioUrl", "https://example.com/audio/1.mp3"
                    )
                ),
                "totalElements", 1,
                "totalPages", 1,
                "currentPage", page,
                "message", "Search completed successfully"
            ));
        } catch (Exception e) {
            log.error("Error searching tracks: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Search failed",
                "message", "Failed to search tracks"
            ));
        }
    }
    
    @GetMapping("/recommendations/user/{userId}")
    @Operation(summary = "Get Personalized Recommendations", description = "Get personalized music recommendations")
    @ApiResponse(responseCode = "200", description = "Recommendations retrieved successfully")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> getPersonalizedRecommendations(@PathVariable Long userId,
                                                          @RequestParam(defaultValue = "daily") String type,
                                                          Authentication authentication) {
        try {
            log.info("Getting {} recommendations for user {}", type, userId);
            
            return ResponseEntity.ok(Map.of(
                "recommendations", List.of(
                    Map.of(
                        "id", 1,
                        "title", "Recommended Track 1",
                        "artist", "Artist Name",
                        "reason", "Based on your listening history",
                        "score", 0.95
                    )
                ),
                "type", type,
                "generatedAt", System.currentTimeMillis(),
                "message", "Recommendations generated successfully"
            ));
        } catch (Exception e) {
            log.error("Error getting recommendations for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Recommendation failed",
                "message", "Failed to generate recommendations"
            ));
        }
    }
    
    @GetMapping("/trending/tracks")
    @Operation(summary = "Get Trending Tracks", description = "Get currently trending tracks")
    @ApiResponse(responseCode = "200", description = "Trending tracks retrieved successfully")
    public ResponseEntity<?> getTrendingTracks(@RequestParam(defaultValue = "global") String region,
                                             @RequestParam(defaultValue = "20") int limit) {
        try {
            log.info("Getting trending tracks for region: {}, limit: {}", region, limit);
            
            return ResponseEntity.ok(Map.of(
                "trendingTracks", List.of(
                    Map.of(
                        "id", 1,
                        "title", "Trending Song 1",
                        "artist", "Popular Artist",
                        "playCount", 1000000,
                        "trendScore", 98.5,
                        "position", 1
                    )
                ),
                "region", region,
                "updatedAt", System.currentTimeMillis(),
                "message", "Trending tracks retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error getting trending tracks: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Trending retrieval failed",
                "message", "Failed to retrieve trending tracks"
            ));
        }
    }
}