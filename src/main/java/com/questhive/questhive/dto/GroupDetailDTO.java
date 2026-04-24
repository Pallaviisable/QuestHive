// com/questhive/questhive/dto/GroupDetailDTO.java
package com.questhive.questhive.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupDetailDTO {
    private String id;
    private String name;
    private String description;
    private String adminId;
    private String inviteCode;
    private LocalDateTime createdAt;
    private List<MemberDTO> members;
}