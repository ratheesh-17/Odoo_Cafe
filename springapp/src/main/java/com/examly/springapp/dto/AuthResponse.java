package com.examly.springapp.dto;

import com.examly.springapp.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AuthResponse {
    
    public AuthResponse() {}
    
    public AuthResponse(String token, String type, UserInfo user, String message) {
        this.token = token;
        this.type = type;
        this.user = user;
        this.message = message;
    }
    
    private String token;
    private String type = "Bearer";
    private UserInfo user;
    private String message;
    
    public AuthResponse(String token, UserInfo user, String message) {
        this.token = token;
        this.user = user;
        this.message = message;
    }
    
    public static class UserInfo {
        
        public UserInfo() {}
        
        public UserInfo(Long id, String name, String email, User.Role role, LocalDateTime createdAt, LocalDateTime lastLogin) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.createdAt = createdAt;
            this.lastLogin = lastLogin;
        }
        private Long id;
        private String name;
        private String email;
        private User.Role role;
        private LocalDateTime createdAt;
        private LocalDateTime lastLogin;
        
        public static UserInfo fromUser(User user) {
            return new UserInfo(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getLastLogin()
            );
        }
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public User.Role getRole() { return role; }
        public void setRole(User.Role role) { this.role = role; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getLastLogin() { return lastLogin; }
        public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    }
    
    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}