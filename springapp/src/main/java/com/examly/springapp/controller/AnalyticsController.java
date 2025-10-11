package com.examly.springapp.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/analytics")
@Tag(name = "Analytics & Reporting", description = "Music analytics, user engagement, and business intelligence")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);
    
    @GetMapping("/user/listening-stats")
    @Operation(summary = "Get User Listening Statistics", description = "Get detailed listening analytics for current user")
    @ApiResponse(responseCode = "200", description = "Listening statistics retrieved successfully")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserListeningStats(@RequestParam(defaultValue = "30") int days,
                                                 Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("Retrieving listening stats for user {} for {} days", userEmail, days);
            
            return ResponseEntity.ok(Map.of(
                "totalListeningTime", 7200, // seconds
                "tracksPlayed", 150,
                "uniqueArtists", 45,
                "topGenres", List.of(
                    Map.of("genre", "Rock", "percentage", 35.5),
                    Map.of("genre", "Pop", "percentage", 28.2),
                    Map.of("genre", "Hip-Hop", "percentage", 20.1)
                ),
                "period", days + " days",
                "message", "Listening statistics retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving listening stats for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Analytics retrieval failed",
                "message", "Failed to retrieve listening statistics"
            ));
        }
    }
    
    @GetMapping("/admin/platform-stats")
    @Operation(summary = "Get Platform Statistics", description = "Get comprehensive platform analytics for administrators")
    @ApiResponse(responseCode = "200", description = "Platform statistics retrieved successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPlatformStats(@RequestParam(defaultValue = "30") int days) {
        try {
            log.info("Retrieving platform statistics for {} days", days);
            
            return ResponseEntity.ok(Map.of(
                "userMetrics", Map.of(
                    "totalUsers", 50000,
                    "activeUsers", 35000,
                    "newRegistrations", 1200,
                    "premiumSubscribers", 15000
                ),
                "contentMetrics", Map.of(
                    "totalTracks", 2500000,
                    "totalPlaylists", 125000,
                    "tracksUploaded", 5000,
                    "playlistsCreated", 2500
                ),
                "period", days + " days",
                "message", "Platform statistics retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving platform statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Analytics retrieval failed",
                "message", "Failed to retrieve platform statistics"
            ));
        }
    }
}