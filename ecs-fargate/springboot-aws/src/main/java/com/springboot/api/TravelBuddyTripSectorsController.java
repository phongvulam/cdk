package com.springboot.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TravelBuddyTripSectorsController {
	
	@Autowired
	TravelBuddyTripSectorsRepository travelBuddyTripSectorsRepository;
	
	
	@GetMapping(value = "/api/{travelId}")
	public TravelBuddyTripSectors getTravelByID(@PathVariable("travelId") String travelId) {
		return travelBuddyTripSectorsRepository.findById(travelId);
    }
}
