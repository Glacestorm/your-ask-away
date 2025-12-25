// Vertical Deep Tech PRO Hooks
export { useHealthcarePro } from './useHealthcarePro';
export { useAgriculturePro } from './useAgriculturePro';
export { useIndustrialPro } from './useIndustrialPro';
export { useServicesPro } from './useServicesPro';

// Re-export types
export type {
  TelemedicineSession,
  ElectronicPrescription,
  Medication,
  EHRRecord,
  DiagnosisAssistResult,
  DrugInteraction,
  RemoteMonitoringData,
  PatientJourney,
} from './useHealthcarePro';

export type {
  PrecisionFarmingData,
  IoTSensorReading,
  WeatherPrediction,
  FieldNotebookEntry,
  BlockchainTrace,
  IrrigationPlan,
  CropHealthAnalysis,
} from './useAgriculturePro';

export type {
  PropertyToken,
  PropertyValuation,
  DigitalTwin,
  PredictiveMaintenance,
  OEEMetrics,
  FleetVehicle,
  RouteOptimization,
  SupplyChainBlock,
  SmartGridData,
  CarbonTrading,
  RenewableForecast,
  BIMModel,
  ConstructionDigitalTwin,
  SafetyMonitor,
} from './useIndustrialPro';

export type {
  ContractAnalysis,
  LegalPrecedent,
  SmartContract,
  AdaptiveLearningPath,
  AITutorSession,
  ProctorAnalysis,
  RevenuePricing,
  GuestExperience,
  ReviewSentiment,
  KnowledgeArticle,
  ProjectProfitability,
  ResourceAllocation,
  CitizenService,
  SmartCityMetrics,
  EmergencyResponse,
  AgenticCommerce,
  InventoryPrediction,
  CustomerDNA,
} from './useServicesPro';
