package com.examly.springapp.exception;

public class CollaborationPermissionException extends RuntimeException {
    public CollaborationPermissionException(String message) {
        super(message);
    }
}