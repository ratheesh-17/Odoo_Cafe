package com.examly.springapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class SignupRequest {
    
    public SignupRequest() {}
    
    public SignupRequest(String name, String username, String email, String password, String confirmPassword, String role, String subscriptionTier, String preferences, String dateOfBirth, java.util.List<String> favoriteGenres, java.util.List<String> preferredArtists) {
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.role = role;
        this.subscriptionTier = subscriptionTier;
        this.preferences = preferences;
        this.dateOfBirth = dateOfBirth;
        this.favoriteGenres = favoriteGenres;
        this.preferredArtists = preferredArtists;
    }
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @Email(message = "Please provide a valid email")
    @NotBlank(message = "Email is required")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    
    @NotBlank(message = "Please confirm your password")
    private String confirmPassword;
    
    private String role = "LISTENER";
    
    private String subscriptionTier = "FREE";
    
    private String preferences; // JSON string for music preferences
    
    private String dateOfBirth;
    
    private java.util.List<String> favoriteGenres;
    
    private java.util.List<String> preferredArtists;
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getSubscriptionTier() { return subscriptionTier; }
    public void setSubscriptionTier(String subscriptionTier) { this.subscriptionTier = subscriptionTier; }
    
    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
    
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public java.util.List<String> getFavoriteGenres() { return favoriteGenres; }
    public void setFavoriteGenres(java.util.List<String> favoriteGenres) { this.favoriteGenres = favoriteGenres; }
    
    public java.util.List<String> getPreferredArtists() { return preferredArtists; }
    public void setPreferredArtists(java.util.List<String> preferredArtists) { this.preferredArtists = preferredArtists; }
}