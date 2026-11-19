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

// Small white trend line drawn under the KPI value (e.g. last 7 days).
function Sparkline({ values }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${22 - ((v - min) / span) * 18}`).join(" ");
  return (
    <Box component="svg" viewBox="0 0 100 24" preserveAspectRatio="none" sx={{ width: "100%", height: 22, mt: 0.25, overflow: "visible" }}>
      <polygon points={`0,24 ${points} 100,24`} fill="rgba(255,255,255,.16)" />
      <polyline points={points} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
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
  minHeight = 61,
  spark,
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
          px: 1.2,
          py: 0.9,
          pr: 4.25,
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
            fontSize: 10,
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
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.15,
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
              fontSize: 9.5,
              lineHeight: 1.25,
            }}
          >
            {note}
          </Typography>
        ) : null}
        {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
      </Stack>

      {icon ? (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            width: 24,
            height: 24,
            borderRadius: 1.4,
            border: "1px solid rgba(255,255,255,.30)",
            bgcolor: "rgba(255,255,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "common.white",
            "& .MuiSvgIcon-root": {
              fontSize: 15,
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
