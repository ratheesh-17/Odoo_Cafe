package com.examly.springapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaybackRequest {
    
    private Long trackId;
    
    private Long playlistId;
    
    private String deviceType; // web, mobile, smart_speaker
    
    private String audioQuality; // 128kbps, 320kbps, lossless
    
    private boolean shuffle = false;
    
    private String repeatMode = "none"; // none, track, playlist
    
    private Integer position; // position in seconds to start playback
    
    private java.util.List<Long> queue; // track IDs for queue
}