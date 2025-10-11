package com.examly.springapp.controller;

import com.examly.springapp.dto.*;
import com.examly.springapp.service.UserService;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and account management endpoints")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    private final UserService userService;
    
    @PostMapping("/signup")
    @Operation(summary = "User Registration", description = "Register a new user account with music preferences")
    @ApiResponse(responseCode = "201", description = "User registered successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @ApiResponse(responseCode = "409", description = "Email already exists")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        try {
            log.info("Signup attempt for email: {}", request.getEmail());
            AuthResponse response = userService.signup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("Signup failed for email {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Registration failed",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Unexpected error during signup for email {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "An unexpected error occurred during registration"
            ));
        }
    }
    
    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticate user and get access token")
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for email: {}", request.getEmail());
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            log.warn("Login failed for email {}: Invalid credentials", request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Authentication failed",
                "message", "Invalid email or password"
            ));
        } catch (IllegalStateException e) {
            log.warn("Login failed for email {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Account issue",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Unexpected error during login for email {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "An unexpected error occurred during login"
            ));
        }
    }
    
    @GetMapping("/profile")
    @Operation(summary = "Get User Profile", description = "Get current user's profile information")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            AuthResponse.UserInfo profile = userService.getUserProfile(userEmail);
            return ResponseEntity.ok(Map.of(
                "user", profile,
                "message", "Profile retrieved successfully"
            ));
        } catch (Exception e) {
            log.error("Error retrieving profile for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "Failed to retrieve profile"
            ));
        }
    }
    
    @PutMapping("/profile")
    @Operation(summary = "Update User Profile", description = "Update current user's profile information")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request, 
                                         Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("Profile update attempt for user: {}", userEmail);
            AuthResponse response = userService.updateProfile(userEmail, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Profile update failed for user {}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Update failed",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error updating profile for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "Failed to update profile"
            ));
        }
    }
    
    @PostMapping("/change-password")
    @Operation(summary = "Change Password", description = "Change current user's password")
    @ApiResponse(responseCode = "200", description = "Password changed successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @ApiResponse(responseCode = "401", description = "Unauthorized or incorrect current password")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                          Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("Password change attempt for user: {}", userEmail);
            userService.changePassword(userEmail, request);
            return ResponseEntity.ok(Map.of(
                "message", "Password changed successfully"
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Password change failed for user {}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Password change failed",
                "message", e.getMessage()
            ));
        } catch (BadCredentialsException e) {
            log.warn("Password change failed for user {}: Incorrect current password", authentication.getName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Authentication failed",
                "message", "Current password is incorrect"
            ));
        } catch (Exception e) {
            log.error("Error changing password for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "Failed to change password"
            ));
        }
    }
    
    @PostMapping("/logout")
    @Operation(summary = "User Logout", description = "Logout current user")
    @ApiResponse(responseCode = "200", description = "Logout successful")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> logout(Authentication authentication) {
        log.info("User logged out: {}", authentication.getName());
        return ResponseEntity.ok(Map.of(
            "message", "Logout successful"
        ));
    }
    
    @DeleteMapping("/account")
    @Operation(summary = "Delete Account", description = "Delete current user's account")
    @ApiResponse(responseCode = "200", description = "Account deleted successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            log.info("Account deletion attempt for user: {}", userEmail);
            userService.deleteUser(userEmail);
            return ResponseEntity.ok(Map.of(
                "message", "Account deleted successfully"
            ));
        } catch (Exception e) {
            log.error("Error deleting account for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", "Failed to delete account"
            ));
        }
    }
    
    @GetMapping("/validate-token")
    @Operation(summary = "Validate Token", description = "Validate if the current token is valid")
    @ApiResponse(responseCode = "200", description = "Token is valid")
    @ApiResponse(responseCode = "401", description = "Token is invalid")
    @PreAuthorize("hasRole('FREE_USER') or hasRole('PREMIUM_USER') or hasRole('ARTIST') or hasRole('ADMIN')")
    public ResponseEntity<?> validateToken(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "valid", true,
            "user", authentication.getName(),
            "message", "Token is valid"
        ));
    }
}