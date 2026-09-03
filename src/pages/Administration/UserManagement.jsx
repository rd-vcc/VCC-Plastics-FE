import { Box, Chip, Stack, Typography } from "@mui/material";
import AgGridTable from "../../components/tables/BasicTables/BasicTableOne";
const rowData = [
    {
        id: 1,
        employeeCode: "VCC001",
        fullName: "Nguyễn Văn An",
        username: "an.nguyen",
        department: "Production",
        role: "Production Manager",
        status: "Active",
        lastLogin: "27/08/2026 16:20",
    },
    {
        id: 2,
        employeeCode: "VCC002",
        fullName: "Trần Minh Đức",
        username: "duc.tran",
        department: "Quality",
        role: "Quality Engineer",
        status: "Active",
        lastLogin: "27/08/2026 15:45",
    },
    {
        id: 3,
        employeeCode: "VCC003",
        fullName: "Lê Hoàng Nam",
        username: "nam.le",
        department: "Maintenance",
        role: "Maintenance Engineer",
        status: "Active",
        lastLogin: "27/08/2026 14:10",
    },
    {
        id: 4,
        employeeCode: "VCC004",
        fullName: "Phạm Anh Tuấn",
        username: "tuan.pham",
        department: "Planning",
        role: "Production Planner",
        status: "Inactive",
        lastLogin: "25/08/2026 09:30",
    },
    {
        id: 5,
        employeeCode: "VCC005",
        fullName: "Đỗ Quang Huy",
        username: "huy.do",
        department: "Administration",
        role: "Administrator",
        status: "Active",
        lastLogin: "27/08/2026 17:02",
    },
];
const columnDefs = [
    {
        headerName: "STT",
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        sortable: false,
        filter: false,
    },
    {
        headerName: "Mã nhân viên",
        field: "employeeCode",
        width: 130,
    },
    {
        headerName: "Họ và tên",
        field: "fullName",
        minWidth: 180,
        flex: 1.2,
    },
    {
        headerName: "Tên đăng nhập",
        field: "username",
        minWidth: 150,
        flex: 1,
    },
    {
        headerName: "Bộ phận",
        field: "department",
        minWidth: 150,
        flex: 1,
    },
    {
        headerName: "Role",
        field: "role",
        minWidth: 190,
        flex: 1.2,
    },
    {
        headerName: "Trạng thái",
        field: "status",
        width: 120,
        cellRenderer: (params) => (<Chip label={params.value === "Active" ? "Hoạt động" : "Ngừng"} size="small" color={params.value === "Active" ? "success" : "default"} variant="outlined"/>),
    },
    {
        headerName: "Đăng nhập gần nhất",
        field: "lastLogin",
        minWidth: 170,
        flex: 1,
    },
];
export default function UserManagement() {
    return (<Box>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          User Management
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Quản lý tài khoản người dùng trong hệ thống
        </Typography>
      </Stack>

      <Box sx={{ height: 480, width: "100%" }}>
        <AgGridTable rowData={rowData} columnDefs={columnDefs}/>
      </Box>
    </Box>);
}
