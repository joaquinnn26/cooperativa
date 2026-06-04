using System.Data;
using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Cooperativa.Api.Controllers;

[ApiController]
[Route("api/turnos")]
public sealed class TurnosController : ControllerBase
{
    private static readonly TimeSpan[] AllowedSlots =
    {
        new(8, 0, 0),
        new(8, 30, 0),
        new(9, 0, 0),
        new(9, 30, 0),
        new(10, 0, 0),
        new(10, 30, 0),
        new(11, 0, 0),
        new(11, 30, 0),
        new(12, 0, 0),
        new(12, 30, 0),
        new(13, 0, 0),
        new(13, 30, 0)
    };

    private static readonly HashSet<string> AllowedSlotKeys = AllowedSlots
        .Select(FormatHora)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    private readonly string _connectionString;

    public TurnosController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:DefaultConnection.");
    }

    [HttpGet("disponibilidad")]
    public async Task<ActionResult<IReadOnlyList<DiaDisponibleDto>>> ObtenerDisponibilidad(
        [FromQuery] DateTime? desde,
        [FromQuery] int dias = 12,
        CancellationToken cancellationToken = default)
    {
        var startDate = desde?.Date ?? DateTime.Today;
        if (startDate < DateTime.Today) startDate = DateTime.Today;

        dias = Math.Clamp(dias, 1, 30);
        var searchUntil = startDate.AddDays(dias * 4);

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var occupied = await GetOccupiedSlotsAsync(connection, startDate, searchUntil, null, cancellationToken);

        var result = new List<DiaDisponibleDto>();
        var cursor = startDate;
        var guard = 0;

        while (result.Count < dias && guard < dias * 4)
        {
            if (IsBusinessDay(cursor))
            {
                var horarios = AllowedSlots
                    .Where(slot => !IsPastSlot(cursor, slot))
                    .Where(slot => !occupied.Contains(SlotKey(cursor, slot)))
                    .Select(FormatHora)
                    .ToArray();

                result.Add(new DiaDisponibleDto(
                    Fecha: FormatFecha(cursor),
                    Disponible: horarios.Length > 0,
                    Horarios: horarios
                ));
            }

            cursor = cursor.AddDays(1);
            guard++;
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TurnoDto>> CrearTurno(
        [FromBody] CrearTurnoRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateCreateRequest(request, out var fecha, out var hora);
        if (validation is not null) return validation;

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        if (!await IsSlotAvailableAsync(connection, fecha, hora, null, cancellationToken))
        {
            return Conflict(new { message = "El horario seleccionado ya no esta disponible." });
        }

        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO dbo.Turnos
              (IdSocio, SocioNombre, SocioDocumento, Fecha, Hora, Motivo, IdEstadoTurno)
            OUTPUT INSERTED.IdTurno
            VALUES
              (@IdSocio, @SocioNombre, @SocioDocumento, @Fecha, @Hora, @Motivo, 1);
            """;

        AddInt(command, "@IdSocio", request.IdSocio!.Value);
        AddString(command, "@SocioNombre", request.SocioNombre);
        AddString(command, "@SocioDocumento", request.SocioDocumento);
        AddDate(command, "@Fecha", fecha);
        AddTime(command, "@Hora", hora);
        AddString(command, "@Motivo", request.Motivo);

        try
        {
            var idTurno = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
            var created = await GetTurnoByIdAsync(connection, idTurno, cancellationToken);
            return CreatedAtAction(nameof(ObtenerTurnosPorSocio), new { idSocio = request.IdSocio }, created);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            return Conflict(new { message = "El horario seleccionado ya no esta disponible." });
        }
    }

    [HttpGet("socio/{idSocio:int}")]
    public async Task<ActionResult<IReadOnlyList<TurnoDto>>> ObtenerTurnosPorSocio(
        int idSocio,
        CancellationToken cancellationToken = default)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        using var command = connection.CreateCommand();
        command.CommandText = $"""
            {TurnoSelect}
            WHERE t.IdSocio = @IdSocio
            ORDER BY t.Fecha DESC, t.Hora DESC;
            """;
        AddInt(command, "@IdSocio", idSocio);

        return Ok(await ReadTurnosAsync(command, cancellationToken));
    }

    [HttpPut("{idTurno:int}/aceptar-propuesta")]
    public async Task<ActionResult<TurnoDto>> AceptarPropuesta(
        int idTurno,
        CancellationToken cancellationToken = default)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var turno = await GetTurnoByIdAsync(connection, idTurno, cancellationToken);
        if (turno is null) return NotFound(new { message = "Turno no encontrado." });

        if (string.IsNullOrWhiteSpace(turno.FechaPropuesta) || string.IsNullOrWhiteSpace(turno.HoraPropuesta))
        {
            return BadRequest(new { message = "El turno no tiene una propuesta pendiente." });
        }

        var fechaPropuesta = DateTime.ParseExact(turno.FechaPropuesta, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        if (!TryParseHora(turno.HoraPropuesta, out var horaPropuesta))
        {
            return BadRequest(new { message = "La hora propuesta no es valida." });
        }

        if (!IsValidDateAndSlot(fechaPropuesta, horaPropuesta, out var message))
        {
            return BadRequest(new { message });
        }

        if (!await IsSlotAvailableAsync(connection, fechaPropuesta, horaPropuesta, idTurno, cancellationToken))
        {
            return Conflict(new { message = "La propuesta ya no esta disponible." });
        }

        using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE dbo.Turnos
            SET Fecha = @Fecha,
                Hora = @Hora,
                IdEstadoTurno = 6
            WHERE IdTurno = @IdTurno;
            """;
        AddDate(command, "@Fecha", fechaPropuesta);
        AddTime(command, "@Hora", horaPropuesta);
        AddInt(command, "@IdTurno", idTurno);
        await command.ExecuteNonQueryAsync(cancellationToken);

        return Ok(await GetTurnoByIdAsync(connection, idTurno, cancellationToken));
    }

    [HttpGet("/api/admin/turnos")]
    public async Task<ActionResult<IReadOnlyList<TurnoDto>>> ObtenerTurnosAdmin(
        CancellationToken cancellationToken = default)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        using var command = connection.CreateCommand();
        command.CommandText = $"""
            {TurnoSelect}
            ORDER BY
              CASE WHEN t.IdEstadoTurno IN (1, 3) THEN 0 ELSE 1 END,
              t.Fecha ASC,
              t.Hora ASC;
            """;

        return Ok(await ReadTurnosAsync(command, cancellationToken));
    }

    [HttpPut("/api/admin/turnos/{idTurno:int}")]
    public async Task<ActionResult<TurnoDto>> ActualizarTurnoAdmin(
        int idTurno,
        [FromBody] ActualizarTurnoAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        var estadoId = ResolveEstadoId(request);
        if (estadoId is null)
        {
            return BadRequest(new { message = "Estado de turno no valido." });
        }

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var turno = await GetTurnoByIdAsync(connection, idTurno, cancellationToken);
        if (turno is null) return NotFound(new { message = "Turno no encontrado." });

        if (estadoId == 2)
        {
            var fecha = DateTime.ParseExact(turno.Fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            TryParseHora(turno.Hora, out var hora);

            if (!await IsSlotAvailableAsync(connection, fecha, hora, idTurno, cancellationToken))
            {
                return Conflict(new { message = "El horario solicitado ya no esta disponible." });
            }
        }

        if (estadoId == 3)
        {
            if (request.FechaPropuesta is null || !TryParseHora(request.HoraPropuesta, out var horaPropuesta))
            {
                return BadRequest(new { message = "Para proponer otro horario debes enviar fechaPropuesta y horaPropuesta." });
            }

            var fechaPropuesta = request.FechaPropuesta.Value.Date;
            if (!IsValidDateAndSlot(fechaPropuesta, horaPropuesta, out var message))
            {
                return BadRequest(new { message });
            }

            if (!await IsSlotAvailableAsync(connection, fechaPropuesta, horaPropuesta, idTurno, cancellationToken))
            {
                return Conflict(new { message = "El horario propuesto ya no esta disponible." });
            }

            using var proposeCommand = connection.CreateCommand();
            proposeCommand.CommandText = """
                UPDATE dbo.Turnos
                SET IdEstadoTurno = 3,
                    FechaPropuesta = @FechaPropuesta,
                    HoraPropuesta = @HoraPropuesta,
                    ObservacionAdmin = @ObservacionAdmin
                WHERE IdTurno = @IdTurno;
                """;
            AddDate(proposeCommand, "@FechaPropuesta", fechaPropuesta);
            AddTime(proposeCommand, "@HoraPropuesta", horaPropuesta);
            AddString(proposeCommand, "@ObservacionAdmin", request.ObservacionAdmin);
            AddInt(proposeCommand, "@IdTurno", idTurno);
            await proposeCommand.ExecuteNonQueryAsync(cancellationToken);

            return Ok(await GetTurnoByIdAsync(connection, idTurno, cancellationToken));
        }

        using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE dbo.Turnos
            SET IdEstadoTurno = @IdEstadoTurno,
                ObservacionAdmin = COALESCE(@ObservacionAdmin, ObservacionAdmin)
            WHERE IdTurno = @IdTurno;
            """;
        AddInt(command, "@IdEstadoTurno", estadoId.Value);
        AddString(command, "@ObservacionAdmin", request.ObservacionAdmin);
        AddInt(command, "@IdTurno", idTurno);
        await command.ExecuteNonQueryAsync(cancellationToken);

        return Ok(await GetTurnoByIdAsync(connection, idTurno, cancellationToken));
    }

    private SqlConnection CreateConnection() => new(_connectionString);

    private ActionResult? ValidateCreateRequest(CrearTurnoRequest request, out DateTime fecha, out TimeSpan hora)
    {
        fecha = request.Fecha?.Date ?? DateTime.MinValue;
        hora = TimeSpan.Zero;

        if (request.IdSocio is null or <= 0)
        {
            return BadRequest(new { message = "El socio es obligatorio." });
        }

        if (string.IsNullOrWhiteSpace(request.Motivo))
        {
            return BadRequest(new { message = "El motivo es obligatorio." });
        }

        if (request.Fecha is null)
        {
            return BadRequest(new { message = "La fecha es obligatoria." });
        }

        if (!TryParseHora(request.Hora, out hora))
        {
            return BadRequest(new { message = "La hora no es valida." });
        }

        if (!IsValidDateAndSlot(fecha, hora, out var message))
        {
            return BadRequest(new { message });
        }

        return null;
    }

    private static bool IsValidDateAndSlot(DateTime fecha, TimeSpan hora, out string message)
    {
        if (fecha.Date < DateTime.Today)
        {
            message = "La fecha debe ser desde hoy en adelante.";
            return false;
        }

        if (!IsBusinessDay(fecha))
        {
            message = "Solo se pueden solicitar turnos de lunes a viernes.";
            return false;
        }

        if (!AllowedSlotKeys.Contains(FormatHora(hora)))
        {
            message = "El horario no esta dentro de la disponibilidad permitida.";
            return false;
        }

        if (IsPastSlot(fecha, hora))
        {
            message = "El horario seleccionado ya paso.";
            return false;
        }

        message = string.Empty;
        return true;
    }

    private static bool IsBusinessDay(DateTime fecha)
    {
        return fecha.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday;
    }

    private static bool IsPastSlot(DateTime fecha, TimeSpan hora)
    {
        return fecha.Date.Add(hora) <= DateTime.Now;
    }

    private static bool TryParseHora(string? value, out TimeSpan hora)
    {
        hora = TimeSpan.Zero;
        return !string.IsNullOrWhiteSpace(value)
            && TimeSpan.TryParse(value, CultureInfo.InvariantCulture, out hora);
    }

    private static int? ResolveEstadoId(ActualizarTurnoAdminRequest request)
    {
        if (request.EstadoId is > 0) return request.EstadoId;
        if (request.IdEstadoTurno is > 0) return request.IdEstadoTurno;

        return Normalize(request.Estado) switch
        {
            "pendiente" => 1,
            "aprobado" or "aprobada" => 2,
            "propuesto" or "propuesta" => 3,
            "rechazado" or "rechazada" => 4,
            "cancelado" or "cancelada" => 5,
            "aceptado" or "aceptada" => 6,
            _ => null
        };
    }

    private static string Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().ToLowerInvariant();
    }

    private static async Task<bool> IsSlotAvailableAsync(
        SqlConnection connection,
        DateTime fecha,
        TimeSpan hora,
        int? excludeTurnoId,
        CancellationToken cancellationToken)
    {
        var occupied = await GetOccupiedSlotsAsync(connection, fecha.Date, fecha.Date, excludeTurnoId, cancellationToken);
        return !occupied.Contains(SlotKey(fecha, hora));
    }

    private static async Task<HashSet<string>> GetOccupiedSlotsAsync(
        SqlConnection connection,
        DateTime desde,
        DateTime hasta,
        int? excludeTurnoId,
        CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Fecha, Hora
            FROM dbo.Turnos
            WHERE Fecha BETWEEN @Desde AND @Hasta
              AND IdEstadoTurno IN (1, 2, 3, 6)
              AND (@ExcludeId IS NULL OR IdTurno <> @ExcludeId)

            UNION ALL

            SELECT FechaPropuesta AS Fecha, HoraPropuesta AS Hora
            FROM dbo.Turnos
            WHERE FechaPropuesta BETWEEN @Desde AND @Hasta
              AND IdEstadoTurno = 3
              AND FechaPropuesta IS NOT NULL
              AND HoraPropuesta IS NOT NULL
              AND (@ExcludeId IS NULL OR IdTurno <> @ExcludeId);
            """;
        AddDate(command, "@Desde", desde);
        AddDate(command, "@Hasta", hasta);
        AddNullableInt(command, "@ExcludeId", excludeTurnoId);

        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            if (reader.IsDBNull(0) || reader.IsDBNull(1)) continue;
            var fecha = reader.GetDateTime(0);
            var hora = (TimeSpan)reader.GetValue(1);
            result.Add(SlotKey(fecha, hora));
        }

        return result;
    }

    private async Task<TurnoDto?> GetTurnoByIdAsync(
        SqlConnection connection,
        int idTurno,
        CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"""
            {TurnoSelect}
            WHERE t.IdTurno = @IdTurno;
            """;
        AddInt(command, "@IdTurno", idTurno);
        return (await ReadTurnosAsync(command, cancellationToken)).FirstOrDefault();
    }

    private static async Task<IReadOnlyList<TurnoDto>> ReadTurnosAsync(
        SqlCommand command,
        CancellationToken cancellationToken)
    {
        var result = new List<TurnoDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(MapTurno(reader));
        }

        return result;
    }

    private const string TurnoSelect = """
        SELECT
          t.IdTurno,
          t.IdSocio,
          t.SocioNombre,
          t.SocioDocumento,
          t.Fecha,
          t.Hora,
          t.Motivo,
          t.IdEstadoTurno,
          e.Nombre AS Estado,
          t.FechaPropuesta,
          t.HoraPropuesta,
          t.ObservacionAdmin,
          t.FechaCreacion
        FROM dbo.Turnos t
        INNER JOIN dbo.EstadoTurno e ON e.IdEstadoTurno = t.IdEstadoTurno
        """;

    private static TurnoDto MapTurno(SqlDataReader reader)
    {
        var idSocio = reader.GetInt32(reader.GetOrdinal("IdSocio"));
        var socioNombre = GetNullableString(reader, "SocioNombre") ?? $"Socio {idSocio}";
        var fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
        var hora = (TimeSpan)reader.GetValue(reader.GetOrdinal("Hora"));
        var fechaPropuestaOrdinal = reader.GetOrdinal("FechaPropuesta");
        var horaPropuestaOrdinal = reader.GetOrdinal("HoraPropuesta");
        var fechaCreacionOrdinal = reader.GetOrdinal("FechaCreacion");

        return new TurnoDto(
            IdTurno: reader.GetInt32(reader.GetOrdinal("IdTurno")),
            Id: reader.GetInt32(reader.GetOrdinal("IdTurno")),
            IdSocio: idSocio,
            Socio: socioNombre,
            SocioNombre: socioNombre,
            DocumentoSocio: GetNullableString(reader, "SocioDocumento") ?? string.Empty,
            SocioDocumento: GetNullableString(reader, "SocioDocumento") ?? string.Empty,
            Fecha: FormatFecha(fecha),
            Hora: FormatHora(hora),
            Motivo: reader.GetString(reader.GetOrdinal("Motivo")),
            IdEstadoTurno: reader.GetInt32(reader.GetOrdinal("IdEstadoTurno")),
            Estado: reader.GetString(reader.GetOrdinal("Estado")),
            FechaPropuesta: reader.IsDBNull(fechaPropuestaOrdinal)
                ? null
                : FormatFecha(reader.GetDateTime(fechaPropuestaOrdinal)),
            HoraPropuesta: reader.IsDBNull(horaPropuestaOrdinal)
                ? null
                : FormatHora((TimeSpan)reader.GetValue(horaPropuestaOrdinal)),
            ObservacionAdmin: GetNullableString(reader, "ObservacionAdmin"),
            FechaCreacion: reader.IsDBNull(fechaCreacionOrdinal)
                ? null
                : reader.GetDateTime(fechaCreacionOrdinal).ToString("s", CultureInfo.InvariantCulture)
        );
    }

    private static string? GetNullableString(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static string SlotKey(DateTime fecha, TimeSpan hora)
    {
        return $"{FormatFecha(fecha)}|{FormatHora(hora)}";
    }

    private static string FormatFecha(DateTime fecha)
    {
        return fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    private static string FormatHora(TimeSpan hora)
    {
        return hora.ToString(@"hh\:mm", CultureInfo.InvariantCulture);
    }

    private static void AddInt(SqlCommand command, string name, int value)
    {
        command.Parameters.Add(name, SqlDbType.Int).Value = value;
    }

    private static void AddNullableInt(SqlCommand command, string name, int? value)
    {
        command.Parameters.Add(name, SqlDbType.Int).Value = value.HasValue ? value.Value : (object)DBNull.Value;
    }

    private static void AddDate(SqlCommand command, string name, DateTime value)
    {
        command.Parameters.Add(name, SqlDbType.Date).Value = value.Date;
    }

    private static void AddTime(SqlCommand command, string name, TimeSpan value)
    {
        command.Parameters.Add(name, SqlDbType.Time).Value = value;
    }

    private static void AddString(SqlCommand command, string name, string? value)
    {
        command.Parameters.Add(name, SqlDbType.NVarChar, -1).Value =
            string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value.Trim();
    }
}

public sealed class CrearTurnoRequest
{
    public int? IdSocio { get; set; }
    public string? SocioNombre { get; set; }
    public string? SocioDocumento { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Hora { get; set; }
    public string? Motivo { get; set; }
}

public sealed class ActualizarTurnoAdminRequest
{
    public int? EstadoId { get; set; }
    public int? IdEstadoTurno { get; set; }
    public string? Estado { get; set; }
    public DateTime? FechaPropuesta { get; set; }
    public string? HoraPropuesta { get; set; }
    public string? ObservacionAdmin { get; set; }
}

public sealed record DiaDisponibleDto(
    string Fecha,
    bool Disponible,
    IReadOnlyList<string> Horarios);

public sealed record TurnoDto(
    int IdTurno,
    int Id,
    int IdSocio,
    string Socio,
    string SocioNombre,
    string DocumentoSocio,
    string SocioDocumento,
    string Fecha,
    string Hora,
    string Motivo,
    int IdEstadoTurno,
    string Estado,
    string? FechaPropuesta,
    string? HoraPropuesta,
    string? ObservacionAdmin,
    string? FechaCreacion);
