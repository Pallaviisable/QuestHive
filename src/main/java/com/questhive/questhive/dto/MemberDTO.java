// com/questhive/questhive/dto/MemberDTO.java
package com.questhive.questhive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MemberDTO {
    private String id;
    private String fullName;
    private String email;
    private String avatarColor;
}