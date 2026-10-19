-- ==========================================================
-- 04_periods_topics.sql: Registration Periods and Topics Seed Data
-- ==========================================================

-- 1. Registration Periods
INSERT INTO registration_periods (id, name, academic_year, semester, start_date, end_date, submission_deadline, status, created_at, updated_at) VALUES
  (1, 'Graduation Thesis Registration Term 1 (2026 - 2027)', '2026-2027', 1, '2026-09-01 00:00:00', '2026-11-30 23:59:59', '2027-01-15 17:00:00', 'OPEN', NOW(6), NOW(6)),
  (2, 'Graduation Thesis Registration Term 2 (2026 - 2027)', '2026-2027', 2, '2027-02-01 00:00:00', '2027-04-30 23:59:59', '2027-06-15 17:00:00', 'DRAFT', NOW(6), NOW(6)),
  (3, 'Capstone Project Registration Term 2 (2024 - 2025)', '2024-2025', 2, '2025-02-15 00:00:00', '2025-05-15 23:59:59', '2025-06-10 17:00:00', 'COMPLETED', NOW(6), NOW(6)),
  (4, 'Graduation Thesis Registration Term 2 (2025 - 2026)', '2025-2026', 2, '2026-02-01 00:00:00', '2026-04-30 23:59:59', '2026-06-15 17:00:00', 'COMPLETED', NOW(6), NOW(6)),
  (5, 'Graduation Thesis Registration Term 1 (2025 - 2026)', '2025-2026', 1, '2025-09-01 00:00:00', '2025-11-30 23:59:59', '2026-01-15 17:00:00', 'CLOSED', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  status = VALUES(status),
  academic_year = VALUES(academic_year),
  semester = VALUES(semester),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  submission_deadline = VALUES(submission_deadline);

-- 2. Registration Period Targeted Faculties
DELETE FROM registration_period_faculties WHERE period_id BETWEEN 1 AND 5;
INSERT INTO registration_period_faculties (period_id, faculty_id) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2), (2, 3),
  (3, 1), (3, 2),
  (4, 1), (4, 2), (4, 3),
  (5, 1), (5, 2), (5, 3);

-- 3. Registration Period Targeted Cohorts
DELETE FROM registration_period_cohorts WHERE period_id BETWEEN 1 AND 5;
INSERT INTO registration_period_cohorts (period_id, cohort_id) VALUES
  (1, 1), -- Period 1 for K21
  (2, 1), -- Period 2 for K21
  (3, 2), -- Period 3 for K22
  (4, 1),
  (5, 4);

-- 4. Diverse Topic Marketplace Seed Data (20 Topics)
INSERT INTO topics (id, title, description, objectives, requirements, department_id, period_id, type, max_students, duration, status, is_registration_open, created_at, updated_at) VALUES
  (1, 'AI-Powered Automated Code Review and Security Vulnerability Scanner', 
   'Design and construct a microservice-based automated code scanning platform using Large Language Models and static code analysis to detect OWASP vulnerabilities.',
   'Deliver a functional web dashboard, automated git webhook trigger, and vulnerability scoring pipeline.',
   'Proficiency in Java Spring Boot, Python FastAPI, ReactJS, and foundational knowledge of AST parsing.',
   1, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (2, 'Smart Campus IoT Environmental Monitoring and Energy Management System',
   'Develop an IoT telemetry collection and dashboard solution for university lecture halls and laboratories with real-time analytics.',
   'Build MQTT ingestion gateway, time-series visualization dashboard, and alert notification system.',
   'Experience with MQTT protocol, Spring Boot WebSocket, ReactJS, and time-series database concepts.',
   2, 1, 'CAPSTONE_PROJECT', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (3, 'Decentralized Academic Credential Verification Platform Using Blockchain',
   'Create an immutable academic transcript and diploma verification portal using Ethereum smart contracts.',
   'Implement student wallet integration, university issuer portal, and verifier QR verification flow.',
   'Solidity, Web3.js, Spring Boot, ReactJS, and cryptographic hashing.',
   3, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (4, 'Large Language Model-driven Clinical Diagnosis Support and Patient Triage System',
   'Build a secure Retrieval-Augmented Generation (RAG) assistant for healthcare specialists analyzing medical records and clinical guidelines.',
   'Design HIPAA-compliant vector database search, clinician evaluation UI, and medical terminology extraction pipeline.',
   'Python, LangChain, Milvus/Qdrant, React, Spring Boot backend API.',
   4, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (5, 'High-Frequency Algorithmic Trading and Quantitative Market Risk Engine',
   'Implement an event-driven stock trading engine with real-time risk calculation and Order Book matching simulation.',
   'Achieve sub-millisecond execution simulation, backtesting framework on historical tick data, and web dashboard.',
   'Java, Kafka, Redis, WebSockets, React, Financial Engineering basics.',
   3, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (6, 'Autonomous Mobile Robot (AMR) Navigation and SLAM in GPS-Denied Warehouses',
   'Research and deploy ROS2-based LiDAR SLAM and path planning algorithms for autonomous transport vehicles in smart factories.',
   'Complete simulation in Gazebo, physical robot obstacle avoidance testing, and remote fleet control web UI.',
   'ROS2, C++, Python, Computer Vision, MQTT, React dashboard.',
   6, 1, 'GRADUATION_THESIS', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (7, 'Zero-Trust Microsegmentation and Threat Hunting Platform in Cloud Native',
   'Construct an automated eBPF network traffic monitor with threat behavioral anomaly detection for Kubernetes clusters.',
   'Implement eBPF probe sensor, automated MITRE ATT&CK alert engine, and interactive topology map.',
   'Go/Rust, Linux eBPF, Kubernetes, Python ML, React Flow graph.',
   2, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (8, 'Real-Time Urban Traffic Congestion Detection and Dynamic Signal Optimization',
   'Develop an intelligent urban intersection controller utilizing YOLOv10 traffic cameras and reinforcement learning.',
   'Process camera video streams, estimate vehicle density per lane, and adjust traffic light intervals dynamically.',
   'PyTorch, YOLO, OpenCV, Python, React dashboard with real-time video feed.',
   4, 1, 'CAPSTONE_PROJECT', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (9, 'E-Commerce Microservices Architecture with Distributed Tracing and Saga Pattern',
   'Design a high-throughput multi-tenant ecommerce backend adopting event sourcing, CQRS, and Saga orchestration.',
   'Demonstrate zero-downtime rolling updates, distributed transaction rollback, OpenTelemetry tracing, and payment gateway.',
   'Spring Cloud, Kafka, Docker, Kubernetes, Prometheus, Grafana, Next.js.',
   1, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (10, 'Multi-Tenant SaaS ERP Platform for High-Tech Manufacturing SMEs',
   'Build a modular enterprise resource planning application covering inventory, supply chain, and production orders.',
   'Support row-level tenant security, customizable workflow automation, and PDF report generation.',
   'Java Spring Boot, PostgreSQL/MySQL, Tailwind CSS, React, Redis.',
   1, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (11, 'Real-Time Fraud Detection in FinTech Transactions Using Graph Neural Networks',
   'Develop a GNN-based anti-money laundering and account takeover detection pipeline for banking transactions.',
   'Model transaction graphs in Neo4j, train PyTorch Geometric models, and construct an interactive compliance workbench.',
   'Python, PyTorch Geometric, Neo4j, FastAPI, React.',
   4, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (12, 'Drone-based Precision Agriculture Crop Disease Monitoring System',
   'Deploy multispectral aerial image processing to detect early crop diseases and optimize fertilizer distribution.',
   'Stitch drone imagery into orthomosaics, perform vegetation index analysis (NDVI), and output GIS heatmaps.',
   'OpenCV, PyTorch, GeoJSON, Leaflet/Mapbox, Spring Boot.',
   2, 1, 'CAPSTONE_PROJECT', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (13, 'Decentralized Identity (DID) and Verifiable Credentials for Cross-Border Healthcare',
   'Implement W3C compliant Decentralized Identifiers for patient cross-hospital record sharing with cryptographic consent.',
   'Zero-knowledge proof verification, self-sovereign identity mobile wallet, and FHIR standard adapter.',
   'TypeScript, Hyperledger Aries/Indy, WebAssembly, React Native.',
   3, 1, 'RESEARCH', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (14, 'Automated Penetration Testing and Vulnerability Assessment Pipeline',
   'Build an automated security auditing orchestrator for web applications combining DAST, SAST, and container scans.',
   'Integrate Nuclei, OWASP ZAP, Trivy, and generate consolidated executive executive PDF audit reports.',
   'Python, Docker API, Go, Vue/React, Spring Boot.',
   2, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (15, 'Cross-Platform Mobile Telemedicine and Remote Patient Monitoring App',
   'Build an iOS/Android application connecting patients with doctors via WebRTC encrypted video and Bluetooth vitals.',
   'Integrate Bluetooth BLE heart rate monitors, electronic prescription signing, and appointment scheduling.',
   'Flutter, WebRTC, Firebase/Spring Boot, Tailwind CSS doctor portal.',
   1, 1, 'CAPSTONE_PROJECT', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (16, 'Computer Vision-based Driver Drowsiness and Distraction Warning System',
   'Create an edge AI smart dashcam alerting drivers of eye closure, yawn frequency, and mobile phone usage.',
   'Deploy lightweight model to Raspberry Pi / Jetson Nano with audio alarm and cloud fleet telemetry sync.',
   'TensorFlow Lite, MediaPipe, OpenCV, Python, React fleet dashboard.',
   4, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (17, 'Energy Harvesting and Smart Metering System for Green Campus Buildings',
   'Develop LoRaWAN smart power meters with energy consumption forecasting using LSTM recurrent neural networks.',
   'LoRa gateway integration, MQTT ingestion, predictive peak demand alerting, and web management portal.',
   'Embedded C, LoRaWAN, Python, TimeScaleDB, React.',
   2, 1, 'CAPSTONE_PROJECT', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (18, 'Privacy-Preserving Federated Learning for Distributed Medical Imaging',
   'Implement differential privacy and federated averaging across multiple simulated hospital nodes without data centralization.',
   'Train brain MRI classification model while preserving strict data privacy guarantees.',
   'PyTorch, Flower Federated Learning framework, Differential Privacy (Opacus).',
   4, 1, 'RESEARCH', 2, '15 weeks', 'OPEN', 1, NOW(6), NOW(6)),

  (19, 'Enterprise Knowledge Graph Construction and RAG Q&A Assistant',
   'Extract entities and relations from enterprise documents to build knowledge graphs enhancing LLM reasoning accuracy.',
   'Entity resolution pipeline, Graph RAG query engine, and interactive graph exploration interface.',
   'Python, Spacy, Neo4j, LlamaIndex, React Cytoscape.',
   3, 1, 'GRADUATION_THESIS', 3, '15 weeks', 'PENDING_APPROVAL', 1, NOW(6), NOW(6)),

  (20, 'Edge Computing Gateway for Industrial Predictive Maintenance',
   'Deploy vibration signal FFT analysis and vibration anomaly classification on industrial sensor streams.',
   'Detect motor bearing wear early and trigger automated maintenance work orders.',
   'Edge Impulse, Python, C++, InfluxDB, React UI.',
   6, 1, 'CAPSTONE_PROJECT', 2, '15 weeks', 'PENDING_APPROVAL', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  objectives = VALUES(objectives),
  requirements = VALUES(requirements),
  department_id = VALUES(department_id),
  period_id = VALUES(period_id),
  type = VALUES(type),
  max_students = VALUES(max_students),
  duration = VALUES(duration),
  status = VALUES(status),
  is_registration_open = VALUES(is_registration_open),
  updated_at = NOW(6);

-- 5. Topic Lecturers (Advisors)
DELETE FROM topic_lecturers WHERE topic_id BETWEEN 1 AND 20;
INSERT INTO topic_lecturers (topic_id, lecturer_id, advisor_role, created_at, updated_at) VALUES
  (1, 3, 'PRIMARY', NOW(6), NOW(6)),
  (1, 13, 'CO_ADVISOR', NOW(6), NOW(6)),
  (2, 14, 'PRIMARY', NOW(6), NOW(6)),
  (2, 3, 'CO_ADVISOR', NOW(6), NOW(6)),
  (3, 16, 'PRIMARY', NOW(6), NOW(6)),
  (3, 4, 'CO_ADVISOR', NOW(6), NOW(6)),
  (4, 15, 'PRIMARY', NOW(6), NOW(6)),
  (4, 18, 'CO_ADVISOR', NOW(6), NOW(6)),
  (5, 16, 'PRIMARY', NOW(6), NOW(6)),
  (6, 13, 'PRIMARY', NOW(6), NOW(6)),
  (7, 14, 'PRIMARY', NOW(6), NOW(6)),
  (7, 21, 'CO_ADVISOR', NOW(6), NOW(6)),
  (8, 15, 'PRIMARY', NOW(6), NOW(6)),
  (9, 3, 'PRIMARY', NOW(6), NOW(6)),
  (9, 17, 'CO_ADVISOR', NOW(6), NOW(6)),
  (10, 17, 'PRIMARY', NOW(6), NOW(6)),
  (11, 15, 'PRIMARY', NOW(6), NOW(6)),
  (12, 14, 'PRIMARY', NOW(6), NOW(6)),
  (13, 16, 'PRIMARY', NOW(6), NOW(6)),
  (14, 14, 'PRIMARY', NOW(6), NOW(6)),
  (15, 3, 'PRIMARY', NOW(6), NOW(6)),
  (16, 15, 'PRIMARY', NOW(6), NOW(6)),
  (17, 14, 'PRIMARY', NOW(6), NOW(6)),
  (18, 15, 'PRIMARY', NOW(6), NOW(6)),
  (19, 16, 'PRIMARY', NOW(6), NOW(6)),
  (20, 13, 'PRIMARY', NOW(6), NOW(6));

-- 6. Allowed Majors for Topics
DELETE FROM topic_majors WHERE topic_id BETWEEN 1 AND 20;
INSERT INTO topic_majors (topic_id, major_id) VALUES
  (1, 1), (1, 5),
  (2, 4), (2, 5), (2, 1),
  (3, 2), (3, 1), (3, 5),
  (4, 3), (4, 1),
  (5, 2), (5, 3),
  (6, 6), (6, 7), (6, 1),
  (7, 4), (7, 1), (7, 3),
  (8, 3), (8, 1),
  (9, 1), (9, 2), (9, 5),
  (10, 1), (10, 2),
  (11, 3), (11, 2),
  (12, 4), (12, 6),
  (13, 2), (13, 1),
  (14, 4), (14, 1),
  (15, 1), (15, 5),
  (16, 3), (16, 1),
  (17, 4), (17, 6),
  (18, 3), (18, 1),
  (19, 2), (19, 3),
  (20, 6), (20, 7);
