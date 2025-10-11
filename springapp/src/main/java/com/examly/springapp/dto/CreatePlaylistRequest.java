package com.examly.springapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class CreatePlaylistRequest {
    
    public CreatePlaylistRequest() {}
    
    public CreatePlaylistRequest(String title, String description, boolean isPublic, boolean isCollaborative, String coverImageUrl, java.util.List<String> tags, String mood, String category) {
        this.title = title;
        this.description = description;
        this.isPublic = isPublic;
        this.isCollaborative = isCollaborative;
        this.coverImageUrl = coverImageUrl;
        this.tags = tags;
        this.mood = mood;
        this.category = category;
    }
    
    @NotBlank(message = "Playlist title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1-100 characters")
    private String title;
    
    private String description;
    
    private boolean isPublic = false;
    
    private boolean isCollaborative = false;
    
    private String coverImageUrl;
    
    private java.util.List<String> tags;
    
    private String mood;
    
    private String category;
    
    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    
    public boolean isCollaborative() { return isCollaborative; }
    public void setCollaborative(boolean isCollaborative) { this.isCollaborative = isCollaborative; }
    
    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
    
    public java.util.List<String> getTags() { return tags; }
    public void setTags(java.util.List<String> tags) { this.tags = tags; }
    
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}