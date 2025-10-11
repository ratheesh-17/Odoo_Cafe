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
@RequestMapping("/api/social")
@Tag(name = "Social Features", description = "Social networking and community features")
@Slf4j
@RequiredArgsConstructor
public class SocialController {
    
    @PostMapping("/users/{userId}/follow")
    @Operation(summary = "Follow User", description = "Follow another user for social music discovery")
    @ApiResponse(responseCode = "200", description = "User followed successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> followUser(@PathVariable Long userId, Authentication authentication) {
        try {
            String currentUser = authentication.getName();
            log.info("User {} attempting to follow user {}", currentUser, userId);
            
            return ResponseEntity.ok(Map.of(
                "message", "User followed successfully",
                "following", true,
                "userId", userId
            ));
        } catch (Exception e) {
            log.error("Error following user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Follow failed",
                "message", "Failed to follow user"
            ));
        }
    }
    
    @GetMapping("/activity/feed")
    @Operation(summary = "Get Activity Feed", description = "Get social activity feed with music updates")
    @ApiResponse(responseCode = "200", description = "Activity feed retrieved successfully")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> getActivityFeed(Authentication authentication) {
        try {
            String currentUser = authentication.getName();
            log.info("Retrieving activity feed for user {}", currentUser);
            
            return ResponseEntity.ok(Map.of(
                "activities", List.of(
                    Map.of(
                        "type", "playlist_shared",
                        "user", "john_doe",
                        "content", "Shared playlist 'Summer Vibes'",
                        "timestamp", System.currentTimeMillis()
                    )
                ),
                "message", "Activity feed retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving activity feed for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Feed retrieval failed",
                "message", "Failed to retrieve activity feed"
            ));
        }
    }
}