package com.questhive.questhive.config;

import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Enhancement #14: superadmin account changed to pallavisable505@gmail.com
    private static final String SUPER_ADMIN_EMAIL    = "pallavisable505@gmail.com";
    private static final String SUPER_ADMIN_PASSWORD = "SuperAdmin@123";
    private static final String SUPER_ADMIN_NAME     = "Pallavi Sable";

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByEmail(SUPER_ADMIN_EMAIL).ifPresentOrElse(
                existingAdmin -> {
                    if (!"SUPER_ADMIN".equals(existingAdmin.getRole())) {
                        existingAdmin.setRole("SUPER_ADMIN");
                        existingAdmin.setStatus("ACTIVE");
                        existingAdmin.setVerified(true);
                        userRepository.save(existingAdmin);
                    }
                    System.out.println("✅ Super Admin exists: " + SUPER_ADMIN_EMAIL);
                },
                () -> {
                    User superAdmin = new User();
                    superAdmin.setFullName(SUPER_ADMIN_NAME);
                    superAdmin.setUsername("superadmin");
                    superAdmin.setEmail(SUPER_ADMIN_EMAIL);
                    superAdmin.setPassword(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
                    superAdmin.setVerified(true);
                    superAdmin.setRole("SUPER_ADMIN");
                    superAdmin.setStatus("ACTIVE");
                    userRepository.save(superAdmin);
                    System.out.println("✅ Super Admin created: " + SUPER_ADMIN_EMAIL);
                }
        );
    }
}
