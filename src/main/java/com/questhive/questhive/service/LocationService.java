package com.questhive.questhive.service;

import com.questhive.questhive.model.Location;
import com.questhive.questhive.repository.LocationRepository;
import com.questhive.questhive.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final GroupRepository groupRepository;

    // Update or insert user's location
    public Location updateLocation(String userId, double latitude, double longitude, String address) {
        Location location = locationRepository.findByUserId(userId)
                .orElse(new Location());

        location.setUserId(userId);
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setAddress(address);
        location.setUpdatedAt(LocalDateTime.now());

        return locationRepository.save(location);
    }

    // Get all member locations for a group (used by Leaflet map)
    public List<Location> getGroupMemberLocations(String requesterId, String groupId) {
        com.questhive.questhive.model.Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));

        if (!group.getMemberIds().contains(requesterId)) {
            throw new RuntimeException("You are not a member of this group.");
        }

        return locationRepository.findByUserIdIn(group.getMemberIds());
    }

    // Get a single user's location
    public Location getUserLocation(String userId) {
        return locationRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Location not found for this user."));
    }
}