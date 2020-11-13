package com.springboot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.model.Student;
import com.springboot.repository.DynamoDbRepository;

@RestController
@RequestMapping("/student")
public class DynamoDbController {

	@Autowired
	private DynamoDbRepository repository;

	//POST method
	@PostMapping
	public String insertIntoDynamoDB(@RequestBody Student student) {
		repository.insertIntoDynamoDB(student);
		return "Successfully inserted into DynamoDB table";
	}

	//GET methos
	@GetMapping
	public ResponseEntity<Student> getOneStudentDetails(@RequestParam String studentId) {
		Student student = repository.getOneStudentDetails(studentId);
		return new ResponseEntity<Student>(student, HttpStatus.OK);
	}

	//PUT method
	@PutMapping
	public void updateStudentDetails(@RequestBody Student student) {
		repository.updateStudentDetails(student);
	}

	//DELETE method
	@DeleteMapping
	public void deleteStudentDetails(@RequestParam String studentId) {
		Student student = new Student();
		student.setStudentId(studentId);
		repository.deleteStudentDetails(student);
	}
}