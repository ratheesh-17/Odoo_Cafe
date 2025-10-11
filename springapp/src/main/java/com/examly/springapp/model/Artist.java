package com.examly.springapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "artists")
public class Artist {
    
    public Artist() {}
    
    public Artist(Long id, String name, String biography, String genre, String imageUrl, boolean verified, Long followerCount, boolean isActive) {
        this.id = id;
        this.name = name;
        this.biography = biography;
        this.genre = genre;
        this.imageUrl = imageUrl;
        this.verified = verified;
        this.followerCount = followerCount;
        this.isActive = isActive;
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Artist name is required")
    @Size(max = 100)
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String biography;
    
    @Size(max = 50)
    private String genre;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "verified")
    private boolean verified = false;
    
    @Column(name = "follower_count")
    private Long followerCount = 0L;
    
    @Column(name = "is_active")
    private boolean isActive = true;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getBiography() { return biography; }
    public void setBiography(String biography) { this.biography = biography; }
    
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    
    public Long getFollowerCount() { return followerCount; }
    public void setFollowerCount(Long followerCount) { this.followerCount = followerCount; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}