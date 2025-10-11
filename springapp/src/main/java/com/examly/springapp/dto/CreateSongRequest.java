package com.examly.springapp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSongRequest {
    
    @NotBlank(message = "Track title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1-100 characters")
    private String title;
    
    private Long artistId;
    
    @Size(max = 100)
    private String album;
    
    @Size(max = 50)
    private String genre;
    
    @Min(0)
    private int duration; // in seconds
    
    @NotBlank(message = "Audio URL is required")
    private String audioUrl;
    
    private String metadata; // JSON string for additional metadata
}