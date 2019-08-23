export default {
  // Auto Refresh
  AUTO_REFRESH_ON_ERROR_PERIOD_MILLIS: 2 * 1000,
  AUTO_REFRESH_SHORT_PERIOD_MILLIS: 5 * 1000,
  AUTO_REFRESH_MEDIUM_PERIOD_MILLIS: 10 * 1000,
  AUTO_REFRESH_LONG_PERIOD_MILLIS: 20 * 1000,

  SEARCH_CHECK_PERIOD_MILLIS: 50,
  ANIMATION_PERIOD_MILLIS: 5 * 1000,
  ANIMATION_SHOW_HIDE_MILLIS: 500,
  ANIMATION_ROTATION_MILLIS: 500,

  // Roles
  ROLE_SUPER_ADMIN: "S",
  ROLE_ADMIN: "A",
  ROLE_BASIC: "B",
  ROLE_DEMO: "D",

  ENTITY_VEHICLE_MANUFACTURER: "VehicleManufacturer",
  ENTITY_VEHICLE_MANUFACTURERS: "VehicleManufacturers",
  ENTITY_VEHICLE: "Vehicle",
  ENTITY_VEHICLES: "Vehicles",
  ENTITY_USER: "User",
  ENTITY_USERS: "Users",
  ENTITY_TENANT: "Tenant",
  ENTITY_TENANTS: "Tenants",
  ENTITY_COMPANY: "Company",
  ENTITY_COMPANIES: "Companies",
  ENTITY_SETTING: "Setting",
  ENTITY_SETTINGS: "Settings",
  ENTITY_SITE: "Site",
  ENTITY_SITES: "Sites",
  ENTITY_SITE_AREA: "SiteArea",
  ENTITY_SITE_AREAS: "SiteAreas",
  ENTITY_TRANSACTION: "Transaction",
  ENTITY_TRANSACTIONS: "Transactions",
  ENTITY_CHARGING_STATION: "ChargingStation",
  ENTITY_CHARGING_STATIONS: "ChargingStations",
  ENTITY_LOGGING: "Logging",
  ENTITY_LOGGINGS: "Loggings",

  ACTION_CREATE: "Create",
  ACTION_READ: "Read",
  ACTION_UPDATE: "Update",
  ACTION_DELETE: "Delete",
  ACTION_LOGOUT: "Logout",
  ACTION_LIST: "List",
  ACTION_RESET: "Reset",
  ACTION_CLEAR_CACHE: "ClearCache",
  ACTION_REMOTE_START_TRANSACTION: "RemoteStartTransaction",
  ACTION_REMOTE_STOP_TRANSACTION: "RemoteStopTransaction",
  ACTION_REFUND_TRANSACTION: "RefundTransaction",
  ACTION_UNLOCK_CONNECTOR: "UnlockConnector",
  ACTION_GET_CONFIGURATION: "GetConfiguration",

  // Keystore
  SHARED_PREFERENCES_NAME: "eMobilityPreferences",
  KEYCHAIN_SERVICE: "eMobilityKeyChain",

  KEY_CREDENTIALS: "credentials",
  KEY_NAVIGATION_STATE: "navigation-state",

  // Paging
  DEFAULT_PAGING: {
    limit: 10,
    skip: 0
  },
  PAGING_SIZE: 10,
  DEFAULT_ORDERING: [],

  CONN_STATUS_AVAILABLE: "Available",
  CONN_STATUS_OCCUPIED: "Occupied",
  CONN_STATUS_CHARGING: "Charging",
  CONN_STATUS_FAULTED: "Faulted",
  CONN_STATUS_RESERVED: "Reserved",
  CONN_STATUS_FINISHING: "Finishing",
  CONN_STATUS_PREPARING: "Preparing",
  CONN_STATUS_SUSPENDED_EVSE: "SuspendedEVSE",
  CONN_STATUS_SUSPENDED_EV: "SuspendedEV",
  CONN_STATUS_UNAVAILABLE: "Unavailable",

  CONN_TYPE_2: "T2",
  CONN_TYPE_COMBO_CCS: "CCS",
  CONN_TYPE_CHADEMO: "C",

  // Components
  COMPONENTS: {
    OCPI: "ocpi",
    REFUND: "refund",
    PRICING: "pricing",
    ORGANIZATION: "organization",
    ANALYTICS: "analytics"
  }
};
