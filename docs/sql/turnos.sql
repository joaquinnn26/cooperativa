-- SQL Server
-- ATENCION: este script borra y vuelve a crear las tablas de turnos.
-- Se pierden los datos existentes de dbo.Turnos y dbo.EstadoTurno.

SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.TR_Turnos_FechaActualizacion', N'TR') IS NOT NULL
BEGIN
  DROP TRIGGER dbo.TR_Turnos_FechaActualizacion;
END;

IF OBJECT_ID(N'dbo.Turnos', N'U') IS NOT NULL
BEGIN
  DROP TABLE dbo.Turnos;
END;

IF OBJECT_ID(N'dbo.EstadoTurno', N'U') IS NOT NULL
BEGIN
  DROP TABLE dbo.EstadoTurno;
END;

CREATE TABLE dbo.EstadoTurno (
  IdEstadoTurno INT NOT NULL CONSTRAINT PK_EstadoTurno PRIMARY KEY,
  Nombre NVARCHAR(40) NOT NULL CONSTRAINT UQ_EstadoTurno_Nombre UNIQUE
);

INSERT INTO dbo.EstadoTurno (IdEstadoTurno, Nombre)
VALUES
  (1, N'Pendiente'),
  (2, N'Aprobado'),
  (3, N'Propuesto'),
  (4, N'Rechazado'),
  (5, N'Cancelado'),
  (6, N'Aceptado');

CREATE TABLE dbo.Turnos (
  IdTurno INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Turnos PRIMARY KEY,
  IdSocio INT NOT NULL,
  SocioNombre NVARCHAR(160) NULL,
  SocioDocumento NVARCHAR(50) NULL,
  Fecha DATE NOT NULL,
  Hora TIME(0) NOT NULL,
  Motivo NVARCHAR(500) NOT NULL,
  IdEstadoTurno INT NOT NULL CONSTRAINT DF_Turnos_IdEstadoTurno DEFAULT (1),
  FechaPropuesta DATE NULL,
  HoraPropuesta TIME(0) NULL,
  ObservacionAdmin NVARCHAR(500) NULL,
  FechaCreacion DATETIME2(0) NOT NULL CONSTRAINT DF_Turnos_FechaCreacion DEFAULT (SYSUTCDATETIME()),
  FechaActualizacion DATETIME2(0) NULL,

  CONSTRAINT FK_Turnos_EstadoTurno
    FOREIGN KEY (IdEstadoTurno) REFERENCES dbo.EstadoTurno(IdEstadoTurno),

  CONSTRAINT CK_Turnos_HoraPermitida
    CHECK (Hora IN (
      '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30'
    )),

  CONSTRAINT CK_Turnos_PropuestaCompleta
    CHECK (
      (FechaPropuesta IS NULL AND HoraPropuesta IS NULL)
      OR
      (FechaPropuesta IS NOT NULL AND HoraPropuesta IS NOT NULL)
    )
);

IF OBJECT_ID(N'dbo.Socio', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Socio', N'IdSocio') IS NOT NULL
BEGIN
  ALTER TABLE dbo.Turnos WITH CHECK
  ADD CONSTRAINT FK_Turnos_Socio
    FOREIGN KEY (IdSocio) REFERENCES dbo.Socio(IdSocio);
END;

CREATE INDEX IX_Turnos_Socio_Fecha
ON dbo.Turnos (IdSocio, Fecha DESC, Hora DESC);

CREATE INDEX IX_Turnos_Estado_Fecha
ON dbo.Turnos (IdEstadoTurno, Fecha, Hora);

CREATE INDEX IX_Turnos_FechaHora
ON dbo.Turnos (Fecha, Hora);

CREATE UNIQUE INDEX UX_Turnos_FechaHora_Activos
ON dbo.Turnos (Fecha, Hora)
WHERE IdEstadoTurno IN (1, 2, 3, 6);

CREATE UNIQUE INDEX UX_Turnos_Propuesta_Activa
ON dbo.Turnos (FechaPropuesta, HoraPropuesta)
WHERE IdEstadoTurno = 3
  AND FechaPropuesta IS NOT NULL
  AND HoraPropuesta IS NOT NULL;

COMMIT TRANSACTION;
GO

CREATE TRIGGER dbo.TR_Turnos_FechaActualizacion
ON dbo.Turnos
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE turno
  SET FechaActualizacion = SYSUTCDATETIME()
  FROM dbo.Turnos turno
  INNER JOIN inserted i ON i.IdTurno = turno.IdTurno;
END;
GO
