import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./BasicTableOne.css";

export default function AgGridTable({
  rowData,
  columnDefs,
  height = 500,
  loading = false,
  rowSelection = "single",
  pagination = false,
  paginationPageSize = 20,
  onRowClicked,
  onGridReady,
  getRowId,
  className = "",
  rowHeight = 28,
  headerHeight = 30,
}) {
  const isAutoHeight = height === "auto";

  return (
    <div
      className={`ag-theme-quartz vcc-ag-grid w-full ${className}`}
      style={
        isAutoHeight
          ? {
              width: "100%",
            }
          : {
              width: "100%",
              height:
                typeof height === "number"
                  ? `${height}px`
                  : height,
            }
      }
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        loading={loading}
        rowSelection={rowSelection}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        onRowClicked={onRowClicked}
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