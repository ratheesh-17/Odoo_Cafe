package com.examly.springapp.repository;

import com.examly.springapp.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    
    /**
     * Find artist by name
     */
    Optional<Artist> findByNameIgnoreCase(String name);
    
    /**
     * Find artists by genre
     */
    List<Artist> findByGenre(String genre);
    
    /**
     * Find verified artists
     */
    List<Artist> findByVerifiedTrueAndIsActiveTrue();
    
    /**
     * Find active artists
     */
    List<Artist> findByIsActiveTrueOrderByFollowerCountDesc();
    
    /**
     * Find artists by name containing search term
     */
    List<Artist> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
    
    /**
     * Count total active artists
     */
    @Query("SELECT COUNT(a) FROM Artist a WHERE a.isActive = true")
    long countActiveArtists();
}