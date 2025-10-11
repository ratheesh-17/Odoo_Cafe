package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "playlist_tracks")
public class PlaylistTrack {
    
    public PlaylistTrack() {}
    
    public PlaylistTrack(Long id, Playlist playlist, Song track, int position, User addedBy, LocalDateTime addedDate) {
        this.id = id;
        this.playlist = playlist;
        this.track = track;
        this.position = position;
        this.addedBy = addedBy;
        this.addedDate = addedDate;
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Song track;
    
    @Column(name = "position")
    private int position;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;
    
    @Column(name = "added_date")
    private LocalDateTime addedDate;
    
    @PrePersist
    protected void onCreate() {
        addedDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Playlist getPlaylist() { return playlist; }
    public void setPlaylist(Playlist playlist) { this.playlist = playlist; }
    
    public Song getTrack() { return track; }
    public void setTrack(Song track) { this.track = track; }
    
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    
    public User getAddedBy() { return addedBy; }
    public void setAddedBy(User addedBy) { this.addedBy = addedBy; }
    
    public LocalDateTime getAddedDate() { return addedDate; }
    public void setAddedDate(LocalDateTime addedDate) { this.addedDate = addedDate; }
}