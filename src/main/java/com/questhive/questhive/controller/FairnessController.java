package com.questhive.questhive.controller;

import com.questhive.questhive.service.FairnessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fairness")
@RequiredArgsConstructor
public class FairnessController {

    private final FairnessService fairnessService;

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getFairnessReport(@PathVariable String groupId) {
        return ResponseEntity.ok(fairnessService.getFairnessReport(groupId));
    }
}
