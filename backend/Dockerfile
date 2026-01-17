FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom trước để cache dependencies
COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

# Copy source rồi build
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Render thường cấp PORT (thường là 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["sh","-c","java -Dserver.port=${PORT} -jar app.jar"]
