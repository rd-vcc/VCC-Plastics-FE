import { Box, Paper, Stack, Typography } from "@mui/material";

export const KPI_CARD_TONES = Object.freeze({
  primary: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
  success: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  warning: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
  accent: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
  info: "linear-gradient(135deg, #0E7490 0%, #0369A1 100%)",
  danger: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
});

const DEFAULT_COLUMNS = {
  xs: "repeat(2, minmax(0, 1fr))",
  md: "repeat(3, minmax(0, 1fr))",
  xl: "repeat(6, minmax(0, 1fr))",
};

export function KpiCardGroup({
  children,
  columns = DEFAULT_COLUMNS,
  gap = 1.5,
  sx,
}) {
  return (
    <Box
      sx={[
        {
          display: "grid",
          gridTemplateColumns: columns,
          gap,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export function KpiCard({
  label,
  value,
  note,
  icon,
  tone = "primary",
  gradient,
  minHeight = 92,
  sx,
}) {
  const background = gradient || KPI_CARD_TONES[tone] || KPI_CARD_TONES.primary;

  return (
    <Paper
      component="article"
      elevation={0}
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          minHeight,
          p: 1.5,
          pr: 5.75,
          borderRadius: 2,
          background,
          color: "common.white",
          fontFamily: '"Bai Jamjuree", system-ui, sans-serif',
          boxShadow: "0 6px 16px rgba(15,23,42,.10)",
          transition: "transform .18s ease, box-shadow .18s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 9px 22px rgba(15,23,42,.15)",
          },
          "& *": {
            fontFamily: '"Bai Jamjuree", system-ui, sans-serif',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack spacing={0.25}>
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: "rgba(255,255,255,.92)",
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h5"
          noWrap
          sx={{
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>

        {note ? (
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "rgba(255,255,255,.78)",
              fontSize: "0.68rem",
              lineHeight: 1.25,
            }}
          >
            {note}
          </Typography>
        ) : null}
      </Stack>

      {icon ? (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            width: 34,
            height: 34,
            borderRadius: 1.4,
            border: "1px solid rgba(255,255,255,.30)",
            bgcolor: "rgba(255,255,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "common.white",
            "& .MuiSvgIcon-root": {
              fontSize: 21,
            },
          }}
        >
          {icon}
        </Box>
      ) : null}
    </Paper>
  );
}

export default KpiCard;
