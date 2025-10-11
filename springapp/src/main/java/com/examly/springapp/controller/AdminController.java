package com.examly.springapp.controller;

import com.examly.springapp.model.User;
import com.examly.springapp.model.Song;
import com.examly.springapp.service.UserService;
import com.examly.springapp.service.SongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Management", description = "Administrative operations for user and content management")
@Slf4j
@RequiredArgsConstructor
public class AdminController {
    
    private final UserService userService;
    private final SongService songService;

    @GetMapping("/users")
    @Operation(summary = "Get All Users", description = "Retrieve all users for admin management")
    @ApiResponse(responseCode = "200", description = "Users retrieved successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(Map.of(
                "users", users,
                "totalUsers", users.size(),
                "message", "Users retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve users",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get User by ID", description = "Retrieve specific user details")
    @ApiResponse(responseCode = "200", description = "User retrieved successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(Map.of(
                "user", user,
                "message", "User retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "User not found",
                "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Update User Status", description = "Enable/disable user account")
    @ApiResponse(responseCode = "200", description = "User status updated successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            boolean enabled = request.getOrDefault("enabled", true);
            User user = userService.updateUserStatus(id, enabled);
            return ResponseEntity.ok(Map.of(
                "user", user,
                "message", "User status updated successfully"
            ));
        } catch (Exception e) {
            log.error("Error updating user status {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to update user status",
                "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update User Role", description = "Change user role")
    @ApiResponse(responseCode = "200", description = "User role updated successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String role = request.get("role");
            User user = userService.updateUserRole(id, User.Role.valueOf(role));
            return ResponseEntity.ok(Map.of(
                "user", user,
                "message", "User role updated successfully"
            ));
        } catch (Exception e) {
            log.error("Error updating user role {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to update user role",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/songs/pending")
    @Operation(summary = "Get Pending Songs", description = "Retrieve songs pending moderation")
    @ApiResponse(responseCode = "200", description = "Pending songs retrieved successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingSongs() {
        try {
            List<Song> songs = songService.getAllSongs();
            return ResponseEntity.ok(Map.of(
                "songs", songs,
                "totalSongs", songs.size(),
                "message", "Songs retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving pending songs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve songs",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get Admin Dashboard Stats", description = "Retrieve comprehensive admin statistics")
    @ApiResponse(responseCode = "200", description = "Dashboard stats retrieved successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            List<User> users = userService.getAllUsers();
            List<Song> songs = songService.getAllSongs();
            
            long totalUsers = users.size();
            long activeUsers = users.stream().filter(User::isEnabled).count();
            long premiumUsers = users.stream().filter(u -> u.getRole() == User.Role.PREMIUM_USER).count();
            long artists = users.stream().filter(u -> u.getRole() == User.Role.ARTIST).count();
            
            return ResponseEntity.ok(Map.of(
                "userStats", Map.of(
                    "totalUsers", totalUsers,
                    "activeUsers", activeUsers,
                    "premiumUsers", premiumUsers,
                    "artists", artists,
                    "admins", users.stream().filter(u -> u.getRole() == User.Role.ADMIN).count()
                ),
                "contentStats", Map.of(
                    "totalSongs", songs.size(),
                    "recentSongs", songs.stream().limit(10).count()
                ),
                "message", "Dashboard statistics retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving dashboard stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve dashboard statistics",
                "message", e.getMessage()
            ));
        }
    }
}