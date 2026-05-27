package com.questhive.questhive.model;

import lombok.Data;
import java.util.Map;

@Data
public class FairnessReport {
    private String groupId;
    private Map<String, Integer> taskCountPerMember;
    private Map<String, Integer> coinsPerMember;
    private Map<String, String> memberNames;
    private String fairnessStatus; // FAIR, SLIGHTLY_UNEVEN, UNEVEN
    private String suggestion;
}
