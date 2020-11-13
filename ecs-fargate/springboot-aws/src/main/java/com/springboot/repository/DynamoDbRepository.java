package com.springboot.repository;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBSaveExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ComparisonOperator;
import com.amazonaws.services.dynamodbv2.model.ConditionalCheckFailedException;
import com.amazonaws.services.dynamodbv2.model.ExpectedAttributeValue;
import com.springboot.model.Student;

@Repository
public class DynamoDbRepository {

	private static final Logger LOGGER = LoggerFactory.getLogger(DynamoDbRepository.class);

	@Autowired
	private DynamoDBMapper mapper;

	//save operation
	public void insertIntoDynamoDB(Student student) {
		mapper.save(student);
	}

	//query using studentID
	public Student getOneStudentDetails(String studentId) {
		return mapper.load(Student.class, studentId);
	}

	//update student
	public void updateStudentDetails(Student student) {
		try {
			mapper.save(student);
		} catch (ConditionalCheckFailedException exception) {
			LOGGER.error("invalid data - " + exception.getMessage());
		}
	}

	//delete student
	public void deleteStudentDetails(Student student) {
		mapper.delete(student);
	}
}