package com.examly.springapp.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/streaming")
@Tag(name = "Music Streaming", description = "Music streaming and playback control")
@RequiredArgsConstructor
public class MusicStreamingController {
    
    private static final Logger log = LoggerFactory.getLogger(MusicStreamingController.class);
    
    @PostMapping("/play")
    @Operation(summary = "Start Playback", description = "Start playing a track")
    @ApiResponse(responseCode = "200", description = "Playback started successfully")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> startPlayback(@RequestBody Map<String, Object> request,
                                         Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Long trackId = Long.valueOf(request.get("trackId").toString());
            log.info("User {} starting playback for track {}", userEmail, trackId);
            
            return ResponseEntity.ok(Map.of(
                "status", "playing",
                "trackId", trackId,
                "message", "Playback started successfully"
            ));
        } catch (Exception e) {
            log.error("Error starting playback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Playback failed",
                "message", "Failed to start playback"
            ));
        }
    }
    
    @PostMapping("/pause")
    @Operation(summary = "Pause Playback", description = "Pause current playback")
    @ApiResponse(responseCode = "200", description = "Playback paused successfully")
    @PreAuthorize("hasRole('LISTENER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> pausePlayback(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("User {} pausing playback", userEmail);
            
            return ResponseEntity.ok(Map.of(
                "status", "paused",
                "message", "Playback paused successfully"
            ));
        } catch (Exception e) {
            log.error("Error pausing playback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Pause failed",
                "message", "Failed to pause playback"
            ));
        }
    }
}