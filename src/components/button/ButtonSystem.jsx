// BUTTON & TAB DESIGN SYSTEM - dùng toàn hệ thống

export const buttonSystem = {
  // ===== PRIMARY: Thêm mới / Lưu =====
  primary: {
    base: {
      textTransform: "none",
      fontWeight: 700,
      borderRadius: 2,
      px: 2.4,
      py: 0.6,
      color: "#ffffff",
      backgroundColor: "#015DA6",
      border: "1px solid #015DA6",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transition: "all 0.2s ease",
    },
    hover: {
      backgroundColor: "#FA7000",
      borderColor: "#FA7000",
      color: "#ffffff",
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
      transform: "translateY(-1px)",
    },
    active: {
      transform: "translateY(0)",
    },
    "& .MuiSvgIcon-root": {
      color: "#ffffff",
    },
  },

  // ===== EDIT: Sửa =====
  edit: {
    base: {
      textTransform: "none",
      fontWeight: 700,
      fontSize: "0.75rem",
      minHeight: 28,
      borderRadius: 1.5,
      px: 1.5,
      color: "#005BAB",
      backgroundColor: "#ffffff",
      border: "1px solid #005BAB",
    },
    hover: {
      backgroundColor: "#005BAB",
      color: "#ffffff",
      borderColor: "#005BAB",
    },
  },

  // ===== CANCEL: Huỷ =====
  cancel: {
    base: {
      textTransform: "none",
      fontWeight: 550,
      fontSize: "0.85rem",
      borderRadius: 2,
      px: 2.2,
      color: "#111827",
      backgroundColor: "#f3f4f6",
    },
    hover: {
      backgroundColor: "#e5e7eb",
      color: "#111827",
    },
    active: {
      backgroundColor: "#d1d5db",
    },
  },

  // ===== DELETE: Xoá =====
  delete: {
    base: {
      height: 40,
      px: 3,
      fontFamily:
        '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
      borderRadius: "10px",
      textTransform: "none",
      fontWeight: 700,
      color: "#ee1b1b",
      border: "1px solid #fecaca",
      backgroundColor: "#fff",
      boxShadow: "none",
      transition: "all 0.2s ease",
    },
    hover: {
      color: "#fff",
      borderColor: "#ee1b1b",
      backgroundColor: "#ee1b1b",
      boxShadow: "none",
    },
    active: {
      color: "#fff",
      borderColor: "#ee1b1b",
      backgroundColor: "#ee1b1b",
      transform: "translateY(0)",
    },
  },

  // ===== TAB BAR: thanh tab trên cùng =====
  tabBar: {
    container: {
      padding: 2,
      borderRadius: 3,
      marginBottom: 3,
      backgroundColor: "#e3e4e6ff",
      boxShadow: 1,
      border: "none",
      position: "sticky",
      top: 0,
      zIndex: 1200,
      backdropFilter: "saturate(160%) blur(4px)",
      backgroundImage:
        "linear-gradient(rgba(227,228,230,0.96), rgba(227,228,230,0.96))",
      borderBottom: "1px solid #e5e7eb",
      fontFamily: '"Bai Jamjuree", system-ui, sans-serif',
      "& *": {
        fontFamily: '"Bai Jamjuree", system-ui, sans-serif',
      },
    },

    button: {
      base: {
        minWidth: 220,
        height: 44,
        fontWeight: 800,
        fontSize: "0.95rem",
        borderRadius: 3,
        textTransform: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.2,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#fcfcfd",
        border: "1px solid #e5e7eb",
        color: "#6b7280",
        transition:
          "transform .2s ease, box-shadow .2s ease, background .2s ease, color .2s ease",

        "& .MuiButton-startIcon": {
          color: "#6b7280",
          transition: "filter .2s ease, transform .2s ease, color .2s ease",
        },

        "&:hover": {
          transform: "translateY(-1px)",
          backgroundColor: "#ffffff",
          boxShadow: "0 3px 8px rgba(0,0,0,.06)",
          borderColor: "#e5e7eb",
        },

        "&:active": {
          transform: "translateY(0px) scale(.995)",
          boxShadow: "0 2px 6px rgba(0,0,0,.05)",
        },

        "&:focus-visible": {
          outline: "3px solid rgba(96,165,250,.35)",
          outlineOffset: 2,
        },
      },

      active: {
        backgroundColor: "#005BAB",
        color: "#ffffff !important",
        boxShadow: "0 6px 14px rgba(0,91,171,.25)",

        "& .MuiButton-startIcon": {
          color: "#ffffff !important",
        },

        "&:hover": {
          backgroundColor: "#0070c0",
          boxShadow: "0 8px 18px rgba(0,91,171,.35)",
        },
      },
    },
  },
};
