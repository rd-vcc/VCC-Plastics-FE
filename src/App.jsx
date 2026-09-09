import { BrowserRouter as Router, Route, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import NotFound from "./pages/OtherPage/NotFound";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProductionDashboard from "./pages/ProductionManagement/ProductionDashboard";
import ProductionPlanning from "./pages/ProductionManagement/ProductionPlanning";
import ProductionOrderList from "./pages/ProductionManagement/ProductionOrders/ProductionOrderList";
import ProductionOrderDetail from "./pages/ProductionManagement/ProductionOrders/ProductionOrderDetail";
import WorkOrderManagement from "./pages/ProductionManagement/WorkOrders/WorkOrderManagement";
import ProductionExecution from "./pages/ProductionManagement/WorkOrders/ProductionExecution";
import ProductionResults from "./pages/ProductionManagement/ProductionResults";
import MachineMonitoring from "./pages/MachineEquipment/MachineMonitoring";
import MachineDetail from "./pages/MachineEquipment/MachineDetail";
import EquipmentMonitoring from "./pages/MachineEquipment/EquipmentMonitoring";
import DowntimeManagement from "./pages/MachineEquipment/DowntimeManagement";
import AlarmHistory from "./pages/MachineEquipment/AlarmHistory";
import MoldOverview from "./pages/MoldManagement/MoldOverview";
import MoldList from "./pages/MoldManagement/MoldList";
import MoldDetail from "./pages/MoldManagement/MoldDetail";
import MoldStatus from "./pages/MoldManagement/MoldStatus";
import MoldInstallationHistory from "./pages/MoldManagement/MoldInstallationHistory";
import MoldShotCounter from "./pages/MoldManagement/MoldShotCounter";
import MoldLocation from "./pages/MoldManagement/MoldLocation";
import MaterialStatus from "./pages/MaterialManagement/MaterialStatus";
import MaterialRequirement from "./pages/MaterialManagement/MaterialRequirement";
import MaterialAllocation from "./pages/MaterialManagement/MaterialAllocation";
import MaterialUsage from "./pages/MaterialManagement/MaterialUsage";
import MaterialLotHistory from "./pages/MaterialManagement/MaterialLotHistory";
import QualityDashboard from "./pages/QualityManagement/QualityDashboard";
import InspectionManagement from "./pages/QualityManagement/InspectionManagement";
import SPCMonitoring from "./pages/QualityManagement/SPCMonitoring";
import NGManagement from "./pages/QualityManagement/NGManagement";
import MeasuringEquipment from "./pages/QualityManagement/MeasuringEquipment";
import CalibrationManagement from "./pages/QualityManagement/CalibrationManagement";
import MaintenanceOverview from "./pages/MaintenanceManagement/MaintenanceOverview";
import MaintenanceRequests from "./pages/MaintenanceManagement/MaintenanceRequests";
import MaintenancePlanning from "./pages/MaintenanceManagement/MaintenancePlanning";
import MachineEquipmentMaintenance from "./pages/MaintenanceManagement/MachineEquipmentMaintenance";
import MoldMaintenance from "./pages/MaintenanceManagement/MoldMaintenance";
import ProductionToolMaintenance from "./pages/MaintenanceManagement/ProductionToolMaintenance";
import MaintenanceHistory from "./pages/MaintenanceManagement/MaintenanceHistory";
import ProductTraceability from "./pages/Traceability/ProductTraceability";
import MaterialTraceability from "./pages/Traceability/MaterialTraceability";
import LotGenealogy from "./pages/Traceability/LotGenealogy";
import ReportCenter from "./pages/ReportsAnalytics/ReportCenter";
import UserManagement from "./pages/Administration/UserManagement";
import RolePermission from "./pages/Administration/RolePermission";
import AuditLog from "./pages/Administration/AuditLog";
import FactoryStructureMaster from "./pages/SystemConfiguration/MasterData/FactoryStructureMaster";
import ProductMaster from "./pages/SystemConfiguration/MasterData/ProductMaster";
import MachineEquipmentMaster from "./pages/SystemConfiguration/MasterData/MachineEquipmentMaster";
import MoldMaster from "./pages/SystemConfiguration/MasterData/MoldMaster";
import MaterialMaster from "./pages/SystemConfiguration/MasterData/MaterialMaster";
import ProductionToolMaster from "./pages/SystemConfiguration/MasterData/ProductionToolMaster";
import MeasuringEquipmentMaster from "./pages/SystemConfiguration/MasterData/MeasuringEquipmentMaster";
import QualityStandardMaster from "./pages/SystemConfiguration/MasterData/QualityStandardMaster";
import ProcessParameterStandard from "./pages/SystemConfiguration/MasterData/ProcessParameterStandard";
import ShiftCalendarMaster from "./pages/SystemConfiguration/MasterData/ShiftCalendarMaster";
import ReasonCodeMaster from "./pages/SystemConfiguration/MasterData/ReasonCodeMaster";
import IoTDataDictionary from "./pages/SystemConfiguration/IoTConfiguration/IoTDataDictionary";
import DeviceMapping from "./pages/SystemConfiguration/IoTConfiguration/DeviceMapping";
import DataCollectionStatus from "./pages/SystemConfiguration/IoTConfiguration/DataCollectionStatus";
import IntegrationSettings from "./pages/SystemConfiguration/IntegrationSettings";
import SystemSettings from "./pages/SystemConfiguration/SystemSettings";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/Auth/Login";
import EditProfile from "./pages/Account/EditProfile";
import AccountSettings from "./pages/Account/AccountSettings";
import Support from "./pages/Account/Support";
import Notifications from "./pages/Account/Notifications";
import PagePermissionRoute from "./auth/PagePermissionRoute";
import Forbidden from "./pages/OtherPage/Forbidden";
export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/403" element={<Forbidden />} />
            <Route element={<PagePermissionRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="/profile" element={<EditProfile />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route
                path="/production-management/dashboard"
                element={<ProductionDashboard />}
              />
              <Route
                path="/production-management/planning"
                element={<ProductionPlanning />}
              />
              <Route
                path="/production-management/production-orders/list"
                element={<ProductionOrderList />}
              />
              <Route
                path="/production-management/production-orders/detail"
                element={<ProductionOrderDetail />}
              />
              <Route
                path="/production-management/work-orders/management"
                element={<WorkOrderManagement />}
              />
              <Route
                path="/production-management/work-orders/execution"
                element={<ProductionExecution />}
              />
              <Route
                path="/production-management/results"
                element={<ProductionResults />}
              />
              <Route
                path="/machine-equipment/machine-monitoring"
                element={<MachineMonitoring />}
              />
              <Route
                path="/machine-equipment/machine-detail"
                element={<MachineDetail />}
              />
              <Route
                path="/machine-equipment/equipment-monitoring"
                element={<EquipmentMonitoring />}
              />
              <Route
                path="/machine-equipment/downtime-management"
                element={<DowntimeManagement />}
              />
              <Route
                path="/machine-equipment/alarm-history"
                element={<AlarmHistory />}
              />
              <Route
                path="/mold-management/overview"
                element={<MoldOverview />}
              />
              <Route path="/mold-management/list" element={<MoldList />} />
              <Route path="/mold-management/detail" element={<MoldDetail />} />
              <Route path="/mold-management/status" element={<MoldStatus />} />
              <Route
                path="/mold-management/installation-history"
                element={<MoldInstallationHistory />}
              />
              <Route
                path="/mold-management/shot-counter"
                element={<MoldShotCounter />}
              />
              <Route
                path="/mold-management/location"
                element={<MoldLocation />}
              />
              <Route
                path="/material-management/status"
                element={<MaterialStatus />}
              />
              <Route
                path="/material-management/requirement"
                element={<MaterialRequirement />}
              />
              <Route
                path="/material-management/allocation"
                element={<MaterialAllocation />}
              />
              <Route
                path="/material-management/usage"
                element={<MaterialUsage />}
              />
              <Route
                path="/material-management/lot-history"
                element={<MaterialLotHistory />}
              />
              <Route
                path="/quality-management/dashboard"
                element={<QualityDashboard />}
              />
              <Route
                path="/quality-management/inspection-management"
                element={<InspectionManagement />}
              />
              <Route
                path="/quality-management/spc-monitoring"
                element={<SPCMonitoring />}
              />
              <Route
                path="/quality-management/ng-management"
                element={<NGManagement />}
              />
              <Route
                path="/quality-management/measuring-equipment"
                element={<MeasuringEquipment />}
              />
              <Route
                path="/quality-management/calibration-management"
                element={<CalibrationManagement />}
              />
              <Route
                path="/maintenance-management/overview"
                element={<MaintenanceOverview />}
              />
              <Route
                path="/maintenance-management/requests"
                element={<MaintenanceRequests />}
              />
              <Route
                path="/maintenance-management/planning"
                element={<MaintenancePlanning />}
              />
              <Route
                path="/maintenance-management/machine-equipment-maintenance"
                element={<MachineEquipmentMaintenance />}
              />
              <Route
                path="/maintenance-management/mold-maintenance"
                element={<MoldMaintenance />}
              />
              <Route
                path="/maintenance-management/production-tool-maintenance"
                element={<ProductionToolMaintenance />}
              />
              <Route
                path="/maintenance-management/history"
                element={<MaintenanceHistory />}
              />
              <Route
                path="/traceability/product"
                element={<ProductTraceability />}
              />
              <Route
                path="/traceability/material"
                element={<MaterialTraceability />}
              />
              <Route
                path="/traceability/lot-genealogy"
                element={<LotGenealogy />}
              />
              <Route
                path="/reports-analytics/report-center"
                element={<ReportCenter />}
              />
              <Route
                path="/administration/user-management"
                element={<UserManagement />}
              />
              <Route
                path="/administration/role-permission"
                element={<RolePermission />}
              />
              <Route path="/administration/audit-log" element={<AuditLog />} />
              <Route
                path="/system-configuration/master-data/factory-structure"
                element={<FactoryStructureMaster />}
              />
              <Route
                path="/system-configuration/master-data/product"
                element={<ProductMaster />}
              />
              <Route
                path="/system-configuration/master-data/machine-equipment"
                element={<MachineEquipmentMaster />}
              />
              <Route
                path="/system-configuration/master-data/mold"
                element={<MoldMaster />}
              />
              <Route
                path="/system-configuration/master-data/material"
                element={<MaterialMaster />}
              />
              <Route
                path="/system-configuration/master-data/production-tool"
                element={<ProductionToolMaster />}
              />
              <Route
                path="/system-configuration/master-data/measuring-equipment"
                element={<MeasuringEquipmentMaster />}
              />
              <Route
                path="/system-configuration/master-data/quality-standard"
                element={<QualityStandardMaster />}
              />
              <Route
                path="/system-configuration/master-data/process-parameter-standard"
                element={<ProcessParameterStandard />}
              />
              <Route
                path="/system-configuration/master-data/shift-calendar"
                element={<ShiftCalendarMaster />}
              />
              <Route
                path="/system-configuration/master-data/reason-code"
                element={<ReasonCodeMaster />}
              />
              <Route
                path="/system-configuration/iot/data-dictionary"
                element={<IoTDataDictionary />}
              />
              <Route
                path="/system-configuration/iot/device-mapping"
                element={<DeviceMapping />}
              />
              <Route
                path="/system-configuration/iot/data-collection-status"
                element={<DataCollectionStatus />}
              />
              <Route
                path="/system-configuration/integration-settings"
                element={<IntegrationSettings />}
              />
              <Route
                path="/system-configuration/system-settings"
                element={<SystemSettings />}
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
