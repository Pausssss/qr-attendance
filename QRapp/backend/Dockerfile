# ===== Build stage =====
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests clean package

# ===== Run stage =====
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Render tự set biến PORT. Ta bind đúng PORT đó.
ENTRYPOINT ["sh","-c","java -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
