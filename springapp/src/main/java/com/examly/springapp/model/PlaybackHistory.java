package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "playback_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaybackHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Song track;
    
    @Column(name = "played_at")
    private LocalDateTime playedAt;
    
    @Column(name = "duration")
    private int duration; // seconds played
    
    @Column(name = "completion_rate")
    private double completionRate; // percentage of track completed
    
    @Column(name = "device_type")
    private String deviceType;
    
    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
}