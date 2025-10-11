package com.examly.springapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackSearchRequest {
    
    private String query;
    
    private String genre;
    
    private String artist;
    
    private String album;
    
    private String mood;
    
    private Integer minDuration;
    
    private Integer maxDuration;
    
    private String sortBy = "relevance"; // relevance, popularity, date, duration
    
    private String sortOrder = "desc"; // asc, desc
    
    private int page = 0;
    
    private int size = 20;
}