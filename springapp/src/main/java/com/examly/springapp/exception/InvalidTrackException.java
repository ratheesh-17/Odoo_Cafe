package com.examly.springapp.exception;

public class InvalidTrackException extends RuntimeException {
    public InvalidTrackException(String message) {
        super(message);
    }
}