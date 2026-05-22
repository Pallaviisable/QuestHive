package com.questhive.questhive.config;

import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${questhive.superadmin.email}")
    private String superAdminEmail;

    @Value("${questhive.superadmin.password}")
    private String superAdminPassword;

    @Value("${questhive.superadmin.fullname}")
    private String superAdminFullName;

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByEmail(superAdminEmail).ifPresentOrElse(
                existingAdmin -> {
                    // Ensure the existing account always has SUPER_ADMIN role
                    if (!"SUPER_ADMIN".equals(existingAdmin.getRole())) {
                        existingAdmin.setRole("SUPER_ADMIN");
                        existingAdmin.setStatus("ACTIVE");
                        existingAdmin.setVerified(true);
                        userRepository.save(existingAdmin);
                    }
                    System.out.println("✅ Super Admin already exists: " + superAdminEmail);
                },
                () -> {
                    User superAdmin = new User();
                    superAdmin.setFullName(superAdminFullName);
                    superAdmin.setUsername("superadmin");
                    superAdmin.setEmail(superAdminEmail);
                    superAdmin.setPassword(passwordEncoder.encode(superAdminPassword));
                    superAdmin.setVerified(true);
                    superAdmin.setRole("SUPER_ADMIN");
                    superAdmin.setStatus("ACTIVE");
                    userRepository.save(superAdmin);
                    System.out.println("✅ Super Admin created: " + superAdminEmail);
                }
        );
    }
}