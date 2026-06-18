package com.questhive.questhive.controller;

import com.questhive.questhive.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/platform")
    public ResponseEntity<Map<String, Object>> getPlatformAnalytics() {
        return ResponseEntity.ok(analyticsService.getPlatformAnalytics());
    }

    @GetMapping("/group/{groupId}/members")
    public ResponseEntity<List<Map<String, Object>>> getGroupMemberAnalytics(
            @PathVariable String groupId) {
        return ResponseEntity.ok(analyticsService.getGroupMemberAnalytics(groupId));
    }
}
