import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./BasicTableOne.css";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";

// Grid texts (empty table, loading, column filter menu) in the UI language.
const GRID_TEXT = {
  vi: { noRowsToShow: "Không có dữ liệu", loadingOoo: "Đang tải...", filterOoo: "Lọc...", equals: "Bằng", notEqual: "Khác", contains: "Chứa", notContains: "Không chứa", startsWith: "Bắt đầu bằng", endsWith: "Kết thúc bằng", blank: "Trống", notBlank: "Không trống", lessThan: "Nhỏ hơn", greaterThan: "Lớn hơn", lessThanOrEqual: "Nhỏ hơn hoặc bằng", greaterThanOrEqual: "Lớn hơn hoặc bằng", inRange: "Trong khoảng", andCondition: "VÀ", orCondition: "HOẶC", applyFilter: "Áp dụng", resetFilter: "Đặt lại", clearFilter: "Xóa", selectAll: "Chọn tất cả", searchOoo: "Tìm..." },
  ja: { noRowsToShow: "データがありません", loadingOoo: "読み込み中..." },
};

ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridTable({
  rowData,
  columnDefs,
  height = 500,
  loading = false,
  rowSelection = "single",
  onRowClicked,
  onRowDoubleClicked,
  getRowStyle,
  onGridReady,
  getRowId,
  className = "",
  rowHeight = 26,
  headerHeight = 28,
}) {
  const isAutoHeight = height === "auto";
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const localeText = GRID_TEXT[String(i18n.resolvedLanguage || i18n.language || "vi").split("-")[0]];
  const agThemeClass =
    theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

  return (
    <div
      className={`${agThemeClass} vcc-ag-grid w-full ${className}`}
      data-vcc-theme={theme}
      style={
        isAutoHeight
          ? {
              width: "100%",
            }
          : {
              width: "100%",
              height: typeof height === "number" ? `${height}px` : height,
            }
      }
    >
      <AgGridReact
        /*
         * AG Grid 33+ defaults to the new Theming API.
         * This project still imports the legacy CSS themes above, so force
         * legacy mode to prevent the new theme from injecting a white body.
         */
        theme="legacy"
        key={localeText ? i18n.resolvedLanguage : "en"}
        localeText={localeText}
        rowData={rowData}
        columnDefs={columnDefs}
        loading={loading}
        rowSelection={rowSelection}
        /* System-wide rule: tables never paginate; rows scroll inside the fixed-height grid. */
        pagination={false}
        onRowClicked={onRowClicked}
        onRowDoubleClicked={onRowDoubleClicked}
        getRowStyle={getRowStyle}
        onGridReady={onGridReady}
        getRowId={getRowId}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        animateRows={true}
        domLayout={isAutoHeight ? "autoHeight" : "normal"}
        suppressCellFocus={true}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          minWidth: 90,
          cellStyle: {
            display: "flex",
            alignItems: "center",
            fontFamily:
              '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: "11px",
          },
          headerClass: "ag-header-center",
        }}
      />
    </div>
  );
}
