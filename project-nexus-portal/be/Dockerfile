# ==========================================
# Stage 1: Build Stage using Maven & Java 25
# ==========================================
FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /app

# Copy pom.xml and pre-fetch dependencies for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Runtime Stage using Lightweight JRE 25
# ==========================================
FROM eclipse-temurin:25-jre-noble
WORKDIR /app

# Create a non-root system user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy built JAR file from build stage
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
