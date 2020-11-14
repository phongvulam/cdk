package com.springboot.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;

@Repository
public class TravelBuddyTripSectorsRepository {

	private static final Logger log = LoggerFactory.getLogger(TravelBuddyTripSectorsRepository.class);
	
	@Autowired
	private DynamoDBMapper mapper;

	public TravelBuddyTripSectors findById(String travelId) {
		log.info("load: " + travelId);
		return mapper.load(TravelBuddyTripSectors.class, travelId);
	}
}
