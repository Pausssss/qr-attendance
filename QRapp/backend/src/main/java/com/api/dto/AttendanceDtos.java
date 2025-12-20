package com.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public class AttendanceDtos {

  public record QrPayload(
      @NotNull Long sessionId,
      @NotBlank String qrToken
  ) {}

  public record CheckInRequest(
      @Valid @NotNull QrPayload payload,
      @NotNull Double gpsLat,
      @NotNull Double gpsLng,
      @NotBlank String photoUrl
  ) {}
}
