// Central permission catalogue for every protected page.
// Backend permission_code values must match these codes exactly.
export const PAGE_PERMISSIONS = Object.freeze({
  "/": { view: "dashboard.view", edit: "dashboard.edit" },
  "/production-management/dashboard": {
    view: "production.dashboard.view",
    edit: "production.dashboard.edit",
  },
  "/production-management/planning": {
    view: "production.planning.view",
    edit: "production.planning.edit",
  },
  "/production-management/production-orders/list": {
    view: "production.order-list.view",
    edit: "production.order-list.edit",
  },
  "/production-management/production-orders/detail": {
    view: "production.order-detail.view",
    edit: "production.order-detail.edit",
  },
  "/production-management/work-orders/management": {
    view: "production.work-order.view",
    edit: "production.work-order.edit",
  },
  "/production-management/work-orders/execution": {
    view: "production.execution.view",
    edit: "production.execution.edit",
  },
  "/production-management/results": {
    view: "production.results.view",
    edit: "production.results.edit",
  },
  "/machine-equipment/machine-monitoring": {
    view: "machine.monitoring.view",
    edit: "machine.monitoring.edit",
  },
  "/machine-equipment/machine-detail": {
    view: "machine.detail.view",
    edit: "machine.detail.edit",
  },
  "/machine-equipment/equipment-monitoring": {
    view: "equipment.monitoring.view",
    edit: "equipment.monitoring.edit",
  },
  "/machine-equipment/downtime-management": {
    view: "machine.downtime.view",
    edit: "machine.downtime.edit",
  },
  "/machine-equipment/alarm-history": {
    view: "machine.alarm-history.view",
    edit: "machine.alarm-history.edit",
  },
  "/mold-management/overview": {
    view: "mold.overview.view",
    edit: "mold.overview.edit",
  },
  "/mold-management/list": { view: "mold.list.view", edit: "mold.list.edit" },
  "/mold-management/detail": {
    view: "mold.detail.view",
    edit: "mold.detail.edit",
  },
  "/mold-management/status": {
    view: "mold.status.view",
    edit: "mold.status.edit",
  },
  "/mold-management/installation-history": {
    view: "mold.installation-history.view",
    edit: "mold.installation-history.edit",
  },
  "/mold-management/shot-counter": {
    view: "mold.shot-counter.view",
    edit: "mold.shot-counter.edit",
  },
  "/mold-management/location": {
    view: "mold.location.view",
    edit: "mold.location.edit",
  },
  "/material-management/status": {
    view: "material.status.view",
    edit: "material.status.edit",
  },
  "/material-management/requirement": {
    view: "material.requirement.view",
    edit: "material.requirement.edit",
  },
  "/material-management/allocation": {
    view: "material.allocation.view",
    edit: "material.allocation.edit",
  },
  "/material-management/usage": {
    view: "material.usage.view",
    edit: "material.usage.edit",
  },
  "/material-management/lot-history": {
    view: "material.lot-history.view",
    edit: "material.lot-history.edit",
  },
  "/quality-management/dashboard": {
    view: "quality.dashboard.view",
    edit: "quality.dashboard.edit",
  },
  "/quality-management/inspection-management": {
    view: "quality.inspection.view",
    edit: "quality.inspection.edit",
  },
  "/quality-management/spc-monitoring": {
    view: "quality.spc.view",
    edit: "quality.spc.edit",
  },
  "/quality-management/ng-management": {
    view: "quality.ng.view",
    edit: "quality.ng.edit",
  },
  "/quality-management/measuring-equipment": {
    view: "quality.measuring-equipment.view",
    edit: "quality.measuring-equipment.edit",
  },
  "/quality-management/calibration-management": {
    view: "quality.calibration.view",
    edit: "quality.calibration.edit",
  },
  "/maintenance-management/overview": {
    view: "maintenance.overview.view",
    edit: "maintenance.overview.edit",
  },
  "/maintenance-management/requests": {
    view: "maintenance.requests.view",
    edit: "maintenance.requests.edit",
  },
  "/maintenance-management/planning": {
    view: "maintenance.planning.view",
    edit: "maintenance.planning.edit",
  },
  "/maintenance-management/machine-equipment-maintenance": {
    view: "maintenance.machine-equipment.view",
    edit: "maintenance.machine-equipment.edit",
  },
  "/maintenance-management/mold-maintenance": {
    view: "maintenance.mold.view",
    edit: "maintenance.mold.edit",
  },
  "/maintenance-management/production-tool-maintenance": {
    view: "maintenance.production-tool.view",
    edit: "maintenance.production-tool.edit",
  },
  "/maintenance-management/history": {
    view: "maintenance.history.view",
    edit: "maintenance.history.edit",
  },
  "/traceability/product": {
    view: "traceability.product.view",
    edit: "traceability.product.edit",
  },
  "/traceability/material": {
    view: "traceability.material.view",
    edit: "traceability.material.edit",
  },
  "/traceability/lot-genealogy": {
    view: "traceability.lot-genealogy.view",
    edit: "traceability.lot-genealogy.edit",
  },
  "/reports-analytics/report-center": {
    view: "reports.report-center.view",
    edit: "reports.report-center.edit",
  },
  "/administration/user-management": {
    view: "administration.user.view",
    edit: "administration.user.edit",
  },
  "/administration/role-permission": {
    view: "administration.role.view",
    edit: "administration.role.edit",
  },
  "/administration/audit-log": {
    view: "administration.audit-log.view",
    edit: "administration.audit-log.edit",
  },
  "/system-configuration/master-data/factory-structure": {
    view: "configuration.factory-structure.view",
    edit: "configuration.factory-structure.edit",
  },
  "/system-configuration/master-data/product": {
    view: "configuration.product.view",
    edit: "configuration.product.edit",
  },
  "/system-configuration/master-data/machine-equipment": {
    view: "configuration.machine-equipment.view",
    edit: "configuration.machine-equipment.edit",
  },
  "/system-configuration/master-data/mold": {
    view: "configuration.mold.view",
    edit: "configuration.mold.edit",
  },
  "/system-configuration/master-data/material": {
    view: "configuration.material.view",
    edit: "configuration.material.edit",
  },
  "/system-configuration/master-data/production-tool": {
    view: "configuration.production-tool.view",
    edit: "configuration.production-tool.edit",
  },
  "/system-configuration/master-data/measuring-equipment": {
    view: "configuration.measuring-equipment.view",
    edit: "configuration.measuring-equipment.edit",
  },
  "/system-configuration/master-data/quality-standard": {
    view: "configuration.quality-standard.view",
    edit: "configuration.quality-standard.edit",
  },
  "/system-configuration/master-data/process-parameter-standard": {
    view: "configuration.process-parameter-standard.view",
    edit: "configuration.process-parameter-standard.edit",
  },
  "/system-configuration/master-data/shift-calendar": {
    view: "configuration.shift-calendar.view",
    edit: "configuration.shift-calendar.edit",
  },
  "/system-configuration/master-data/reason-code": {
    view: "configuration.reason-code.view",
    edit: "configuration.reason-code.edit",
  },
  "/system-configuration/iot/data-dictionary": {
    view: "configuration.iot-data-dictionary.view",
    edit: "configuration.iot-data-dictionary.edit",
  },
  "/system-configuration/iot/device-mapping": {
    view: "configuration.device-mapping.view",
    edit: "configuration.device-mapping.edit",
  },
  "/system-configuration/iot/data-collection-status": {
    view: "configuration.data-collection-status.view",
    edit: "configuration.data-collection-status.edit",
  },
  "/system-configuration/integration-settings": {
    view: "configuration.integration-settings.view",
    edit: "configuration.integration-settings.edit",
  },
  "/system-configuration/system-settings": {
    view: "configuration.system-settings.view",
    edit: "configuration.system-settings.edit",
  },
});

export function getPagePermissions(pathname) {
  return PAGE_PERMISSIONS[pathname] || null;
}

export function getAllPagePermissionDefinitions() {
  return Object.entries(PAGE_PERMISSIONS).flatMap(([path, permissions]) => [
    { path, action: "view", permissionCode: permissions.view },
    { path, action: "edit", permissionCode: permissions.edit },
  ]);
}
