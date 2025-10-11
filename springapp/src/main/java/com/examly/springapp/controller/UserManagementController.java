package com.examly.springapp.controller;

import com.examly.springapp.model.User;
import com.examly.springapp.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "User Management", description = "Admin endpoints for user role management")
@Slf4j
@RequiredArgsConstructor
public class UserManagementController {
    
    private final UserService userService;
    
    @PutMapping("/users/{email}/role")
    @Operation(summary = "Update User Role", description = "Update a user's role (Admin only)")
    @ApiResponse(responseCode = "200", description = "Role updated successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable String email, @RequestBody Map<String, String> request) {
        try {
            String roleString = request.get("role");
            User.Role newRole = User.Role.valueOf(roleString);
            
            User updatedUser = userService.updateUserRole(email, newRole);
            
            return ResponseEntity.ok(Map.of(
                "message", "User role updated successfully",
                "user", updatedUser.getEmail(),
                "newRole", updatedUser.getRole()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid role",
                "message", "Valid roles: LISTENER, PREMIUM_USER, ARTIST, MODERATOR, ADMIN"
            ));
        } catch (Exception e) {
            log.error("Error updating user role: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to update role",
                "message", e.getMessage()
            ));
        }
    }
}