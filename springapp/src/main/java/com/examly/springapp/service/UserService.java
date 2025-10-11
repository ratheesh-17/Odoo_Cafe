package com.examly.springapp.service;

import com.examly.springapp.configuration.JWTUtil;
import com.examly.springapp.dto.*;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
    
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        log.info("Processing signup request for email: {}", request.getEmail());
        
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        
        // Check if user already exists
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("User with this email already exists");
        }
        
        // Create new user
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Set role from request or default to LISTENER
        try {
            User.Role requestedRole = User.Role.valueOf(request.getRole());
            user.setRole(requestedRole);
        } catch (IllegalArgumentException e) {
            user.setRole(User.Role.LISTENER);
        }
        
        // Save user
        user = userRepository.save(user);
        log.info("User created successfully with ID: {}", user.getId());
        
        // Generate token
        String token = jwtUtil.generateToken(user.getEmail(), user.getAuthorities());
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        return new AuthResponse(token, AuthResponse.UserInfo.fromUser(user), "Account created successfully");
    }
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Processing login request for email: {}", request.getEmail());
        
        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        
        // Check if account is enabled
        if (!user.isEnabled()) {
            throw new IllegalStateException("Account is disabled");
        }
        
        if (!user.isAccountNonLocked()) {
            throw new IllegalStateException("Account is locked");
        }
        
        // Generate token
        String token = jwtUtil.generateToken(user.getEmail(), user.getAuthorities());
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("User logged in successfully: {}", user.getEmail());
        return new AuthResponse(token, AuthResponse.UserInfo.fromUser(user), "Login successful");
    }
    
    @Transactional
    public AuthResponse updateProfile(String userEmail, UpdateProfileRequest request) {
        log.info("Processing profile update for user: {}", userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Update name if provided
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }
        
        // Update email if provided and different
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().toLowerCase().trim();
            if (!newEmail.equals(user.getEmail())) {
                // Check if new email is already taken
                if (userRepository.existsByEmailIgnoreCaseAndIdNot(newEmail, user.getId())) {
                    throw new IllegalArgumentException("Email address is already in use");
                }
                user.setEmail(newEmail);
            }
        }
        
        // Save updated user
        user = userRepository.save(user);
        log.info("Profile updated successfully for user: {}", user.getEmail());
        
        // Generate new token with updated information
        String token = jwtUtil.generateToken(user.getEmail(), user.getAuthorities());
        
        return new AuthResponse(token, AuthResponse.UserInfo.fromUser(user), "Profile updated successfully");
    }
    
    @Transactional
    public void changePassword(String userEmail, ChangePasswordRequest request) {
        log.info("Processing password change for user: {}", userEmail);
        
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("Password changed successfully for user: {}", userEmail);
    }
    
    public AuthResponse.UserInfo getUserProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        return AuthResponse.UserInfo.fromUser(user);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public long getTotalUsersCount() {
        return userRepository.countTotalUsers();
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
    
    @Transactional
    public void deleteUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        userRepository.delete(user);
        log.info("User deleted successfully: {}", userEmail);
    }
    
    @Transactional
    public User updateUserRole(String userEmail, User.Role newRole) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        user.setRole(newRole);
        user = userRepository.save(user);
        log.info("User role updated successfully: {} -> {}", userEmail, newRole);
        return user;
    }
}