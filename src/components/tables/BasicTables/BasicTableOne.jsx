import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./BasicTableOne.css";
import { useTheme } from "../../../context/ThemeContext";

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
  rowHeight = 28,
  headerHeight = 30,
}) {
  const isAutoHeight = height === "auto";
  const { theme } = useTheme();
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
            fontSize: "12px",
          },
          headerClass: "ag-header-center",
        }}
      />
    </div>
  );
}
