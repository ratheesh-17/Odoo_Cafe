package com.examly.springapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tracks")
public class Song {
    
    public Song() {}
    
    public Song(Long id, String title, String artist, String album, String genre, int duration, String audioUrl, String metadata, LocalDateTime uploadDate, Long playCount, boolean isActive) {
        this.id = id;
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.genre = genre;
        this.duration = duration;
        this.audioUrl = audioUrl;
        this.metadata = metadata;
        this.uploadDate = uploadDate;
        this.playCount = playCount;
        this.isActive = isActive;
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Track title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1-100 characters")
    @Column(nullable = false)
    private String title;

    @Column(name = "artist")
    private String artist;

    @Size(max = 100)
    private String album;

    @Size(max = 50)
    private String genre;

    @Min(0)
    @Column(nullable = false)
    private int duration; // in seconds

    @Column(name = "audio_url", nullable = false)
    private String audioUrl;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON string for additional metadata

    @Column(name = "upload_date")
    private LocalDateTime uploadDate;

    @Column(name = "play_count")
    private Long playCount = 0L;

    @Column(name = "is_active")
    private boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        uploadDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }
    
    public String getAlbum() { return album; }
    public void setAlbum(String album) { this.album = album; }
    
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    
    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }
    
    public Long getPlayCount() { return playCount; }
    public void setPlayCount(Long playCount) { this.playCount = playCount; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}