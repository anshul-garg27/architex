import BaseNode from './BaseNode';
import WebServerNode from './WebServerNode';
import LoadBalancerNode from './LoadBalancerNode';
import DatabaseNode from './DatabaseNode';
import CacheNode from './CacheNode';
import MessageQueueNode from './MessageQueueNode';
import APIGatewayNode from './APIGatewayNode';
import CDNNode from './CDNNode';
import ClientNode from './ClientNode';
import StorageNode from './StorageNode';
import AppServerNode from './AppServerNode';
import ServerlessFunctionNode from './ServerlessFunctionNode';
import WorkerServiceNode from './WorkerServiceNode';
import DocumentDBNode from './DocumentDBNode';
import WideColumnNode from './WideColumnNode';
import SearchEngineNode from './SearchEngineNode';
import TimeSeriesDBNode from './TimeSeriesDBNode';
import GraphDBNode from './GraphDBNode';
import PubSubNode from './PubSubNode';
import StreamProcessorNode from './StreamProcessorNode';
import BatchProcessorNode from './BatchProcessorNode';
import MLInferenceNode from './MLInferenceNode';
import DNSNode from './DNSNode';
import CDNEdgeNode from './CDNEdgeNode';
import FirewallNode from './FirewallNode';
import MobileClientNode from './MobileClientNode';
import ThirdPartyAPINode from './ThirdPartyAPINode';
import MetricsCollectorNode from './MetricsCollectorNode';
import LogAggregatorNode from './LogAggregatorNode';
import DistributedTracerNode from './DistributedTracerNode';
import EventBusNode from './EventBusNode';
import RateLimiterNode from './RateLimiterNode';
import SecretManagerNode from './SecretManagerNode';

// ── New: Services ──
import NotificationServiceNode from './NotificationServiceNode';
import SearchServiceNode from './SearchServiceNode';
import AnalyticsServiceNode from './AnalyticsServiceNode';
import SchedulerNode from './SchedulerNode';
import ServiceDiscoveryNode from './ServiceDiscoveryNode';
import ConfigServiceNode from './ConfigServiceNode';
import SecretsManagerV2Node from './SecretsManagerV2Node';
import FeatureFlagsNode from './FeatureFlagsNode';
import AuthServiceV2Node from './AuthServiceV2Node';

// ── New: Networking v2 ──
import VPCNode from './VPCNode';
import SubnetNode from './SubnetNode';
import NATGatewayNode from './NATGatewayNode';
import VPNGatewayNode from './VPNGatewayNode';
import ServiceMeshNode from './ServiceMeshNode';
import DNSServerNode from './DNSServerNode';
import IngressControllerNode from './IngressControllerNode';

// ── New: FinTech ──
import PaymentGatewayNode from './PaymentGatewayNode';
import LedgerServiceNode from './LedgerServiceNode';
import FraudDetectionNode from './FraudDetectionNode';
import HSMNode from './HSMNode';

// ── New: Data Engineering ──
import ETLPipelineNode from './ETLPipelineNode';
import CDCServiceNode from './CDCServiceNode';
import SchemaRegistryNode from './SchemaRegistryNode';
import FeatureStoreNode from './FeatureStoreNode';
import MediaProcessorNode from './MediaProcessorNode';

// ── New: AI / LLM ──
import LLMGatewayNode from './LLMGatewayNode';
import ToolRegistryNode from './ToolRegistryNode';
import MemoryFabricNode from './MemoryFabricNode';
import AgentOrchestratorNode from './AgentOrchestratorNode';
import SafetyMeshNode from './SafetyMeshNode';

// ── New: Security v2 ──
import DDoSShieldNode from './DDoSShieldNode';
import SIEMNode from './SIEMNode';

// ── New: DB Internals ──
import ShardNodeNode from './ShardNodeNode';
import PrimaryNodeNode from './PrimaryNodeNode';
import PartitionNodeNode from './PartitionNodeNode';
import ReplicaNodeNode from './ReplicaNodeNode';
import InputNodeNode from './InputNodeNode';
import OutputNodeNode from './OutputNodeNode';
import CoordinatorNodeNode from './CoordinatorNodeNode';

// Re-export components
export {
  BaseNode,
  WebServerNode,
  LoadBalancerNode,
  DatabaseNode,
  CacheNode,
  MessageQueueNode,
  APIGatewayNode,
  CDNNode,
  ClientNode,
  StorageNode,
  AppServerNode,
  ServerlessFunctionNode,
  WorkerServiceNode,
  DocumentDBNode,
  WideColumnNode,
  SearchEngineNode,
  TimeSeriesDBNode,
  GraphDBNode,
  PubSubNode,
  StreamProcessorNode,
  BatchProcessorNode,
  MLInferenceNode,
  DNSNode,
  CDNEdgeNode,
  FirewallNode,
  MobileClientNode,
  ThirdPartyAPINode,
  MetricsCollectorNode,
  LogAggregatorNode,
  DistributedTracerNode,
  EventBusNode,
  RateLimiterNode,
  SecretManagerNode,
  // Services
  NotificationServiceNode,
  SearchServiceNode,
  AnalyticsServiceNode,
  SchedulerNode,
  ServiceDiscoveryNode,
  ConfigServiceNode,
  SecretsManagerV2Node,
  FeatureFlagsNode,
  AuthServiceV2Node,
  // Networking v2
  VPCNode,
  SubnetNode,
  NATGatewayNode,
  VPNGatewayNode,
  ServiceMeshNode,
  DNSServerNode,
  IngressControllerNode,
  // FinTech
  PaymentGatewayNode,
  LedgerServiceNode,
  FraudDetectionNode,
  HSMNode,
  // Data Engineering
  ETLPipelineNode,
  CDCServiceNode,
  SchemaRegistryNode,
  FeatureStoreNode,
  MediaProcessorNode,
  // AI / LLM
  LLMGatewayNode,
  ToolRegistryNode,
  MemoryFabricNode,
  AgentOrchestratorNode,
  SafetyMeshNode,
  // Security v2
  DDoSShieldNode,
  SIEMNode,
  // DB Internals
  ShardNodeNode,
  PrimaryNodeNode,
  PartitionNodeNode,
  ReplicaNodeNode,
  InputNodeNode,
  OutputNodeNode,
  CoordinatorNodeNode,
};

// Re-export default config constants
export { WEB_SERVER_DEFAULTS } from './WebServerNode';
export { LOAD_BALANCER_DEFAULTS } from './LoadBalancerNode';
export { DATABASE_DEFAULTS } from './DatabaseNode';
export { CACHE_DEFAULTS } from './CacheNode';
export { MESSAGE_QUEUE_DEFAULTS } from './MessageQueueNode';
export { API_GATEWAY_DEFAULTS } from './APIGatewayNode';
export { CDN_DEFAULTS } from './CDNNode';
export { CLIENT_DEFAULTS } from './ClientNode';
export { STORAGE_DEFAULTS } from './StorageNode';
export { APP_SERVER_DEFAULTS } from './AppServerNode';
export { SERVERLESS_FUNCTION_DEFAULTS } from './ServerlessFunctionNode';
export { WORKER_SERVICE_DEFAULTS } from './WorkerServiceNode';
export { DOCUMENT_DB_DEFAULTS } from './DocumentDBNode';
export { WIDE_COLUMN_DEFAULTS } from './WideColumnNode';
export { SEARCH_ENGINE_DEFAULTS } from './SearchEngineNode';
export { TIMESERIES_DB_DEFAULTS } from './TimeSeriesDBNode';
export { GRAPH_DB_DEFAULTS } from './GraphDBNode';
export { PUB_SUB_DEFAULTS } from './PubSubNode';
export { STREAM_PROCESSOR_DEFAULTS } from './StreamProcessorNode';
export { BATCH_PROCESSOR_DEFAULTS } from './BatchProcessorNode';
export { ML_INFERENCE_DEFAULTS } from './MLInferenceNode';
export { DNS_DEFAULTS } from './DNSNode';
export { CDN_EDGE_DEFAULTS } from './CDNEdgeNode';
export { FIREWALL_DEFAULTS } from './FirewallNode';
export { MOBILE_CLIENT_DEFAULTS } from './MobileClientNode';
export { THIRD_PARTY_API_DEFAULTS } from './ThirdPartyAPINode';
export { METRICS_COLLECTOR_DEFAULTS } from './MetricsCollectorNode';
export { LOG_AGGREGATOR_DEFAULTS } from './LogAggregatorNode';
export { DISTRIBUTED_TRACER_DEFAULTS } from './DistributedTracerNode';
export { EVENT_BUS_DEFAULTS } from './EventBusNode';
export { RATE_LIMITER_DEFAULTS } from './RateLimiterNode';
export { SECRET_MANAGER_DEFAULTS } from './SecretManagerNode';
// Services
export { NOTIFICATION_SERVICE_DEFAULTS } from './NotificationServiceNode';
export { SEARCH_SERVICE_DEFAULTS } from './SearchServiceNode';
export { ANALYTICS_SERVICE_DEFAULTS } from './AnalyticsServiceNode';
export { SCHEDULER_DEFAULTS } from './SchedulerNode';
export { SERVICE_DISCOVERY_DEFAULTS } from './ServiceDiscoveryNode';
export { CONFIG_SERVICE_DEFAULTS } from './ConfigServiceNode';
export { SECRETS_MANAGER_V2_DEFAULTS } from './SecretsManagerV2Node';
export { FEATURE_FLAGS_DEFAULTS } from './FeatureFlagsNode';
export { AUTH_SERVICE_V2_DEFAULTS } from './AuthServiceV2Node';
// Networking v2
export { VPC_DEFAULTS } from './VPCNode';
export { SUBNET_DEFAULTS } from './SubnetNode';
export { NAT_GATEWAY_DEFAULTS } from './NATGatewayNode';
export { VPN_GATEWAY_DEFAULTS } from './VPNGatewayNode';
export { SERVICE_MESH_DEFAULTS } from './ServiceMeshNode';
export { DNS_SERVER_DEFAULTS } from './DNSServerNode';
export { INGRESS_CONTROLLER_DEFAULTS } from './IngressControllerNode';
// FinTech
export { PAYMENT_GATEWAY_DEFAULTS } from './PaymentGatewayNode';
export { LEDGER_SERVICE_DEFAULTS } from './LedgerServiceNode';
export { FRAUD_DETECTION_DEFAULTS } from './FraudDetectionNode';
export { HSM_DEFAULTS } from './HSMNode';
// Data Engineering
export { ETL_PIPELINE_DEFAULTS } from './ETLPipelineNode';
export { CDC_SERVICE_DEFAULTS } from './CDCServiceNode';
export { SCHEMA_REGISTRY_DEFAULTS } from './SchemaRegistryNode';
export { FEATURE_STORE_DEFAULTS } from './FeatureStoreNode';
export { MEDIA_PROCESSOR_DEFAULTS } from './MediaProcessorNode';
// AI / LLM
export { LLM_GATEWAY_DEFAULTS } from './LLMGatewayNode';
export { TOOL_REGISTRY_DEFAULTS } from './ToolRegistryNode';
export { MEMORY_FABRIC_DEFAULTS } from './MemoryFabricNode';
export { AGENT_ORCHESTRATOR_DEFAULTS } from './AgentOrchestratorNode';
export { SAFETY_MESH_DEFAULTS } from './SafetyMeshNode';
// Security v2
export { DDOS_SHIELD_DEFAULTS } from './DDoSShieldNode';
export { SIEM_DEFAULTS } from './SIEMNode';
// DB Internals
export { SHARD_NODE_DEFAULTS } from './ShardNodeNode';
export { PRIMARY_NODE_DEFAULTS } from './PrimaryNodeNode';
export { PARTITION_NODE_DEFAULTS } from './PartitionNodeNode';
export { REPLICA_NODE_DEFAULTS } from './ReplicaNodeNode';
export { INPUT_NODE_DEFAULTS } from './InputNodeNode';
export { OUTPUT_NODE_DEFAULTS } from './OutputNodeNode';
export { COORDINATOR_NODE_DEFAULTS } from './CoordinatorNodeNode';

import { withErrorBoundary } from '@/components/shared/ErrorBoundary';

// ── nodeTypes map for React Flow ────────────────────────────

/**
 * Pass this directly to React Flow's `nodeTypes` prop.
 * Each node component is wrapped with an error boundary to prevent
 * a single node crash from taking down the entire canvas.
 *
 * ```tsx
 * <ReactFlow nodeTypes={systemDesignNodeTypes} ... />
 * ```
 */
export const systemDesignNodeTypes = {
  // ── Original types ──
  'web-server': withErrorBoundary(WebServerNode, 'WebServerNode'),
  'load-balancer': withErrorBoundary(LoadBalancerNode, 'LoadBalancerNode'),
  database: withErrorBoundary(DatabaseNode, 'DatabaseNode'),
  cache: withErrorBoundary(CacheNode, 'CacheNode'),
  'message-queue': withErrorBoundary(MessageQueueNode, 'MessageQueueNode'),
  'api-gateway': withErrorBoundary(APIGatewayNode, 'APIGatewayNode'),
  cdn: withErrorBoundary(CDNNode, 'CDNNode'),
  client: withErrorBoundary(ClientNode, 'ClientNode'),
  storage: withErrorBoundary(StorageNode, 'StorageNode'),
  'app-server': withErrorBoundary(AppServerNode, 'AppServerNode'),
  serverless: withErrorBoundary(ServerlessFunctionNode, 'ServerlessFunctionNode'),
  worker: withErrorBoundary(WorkerServiceNode, 'WorkerServiceNode'),
  'document-db': withErrorBoundary(DocumentDBNode, 'DocumentDBNode'),
  'wide-column': withErrorBoundary(WideColumnNode, 'WideColumnNode'),
  'search-engine': withErrorBoundary(SearchEngineNode, 'SearchEngineNode'),
  'timeseries-db': withErrorBoundary(TimeSeriesDBNode, 'TimeSeriesDBNode'),
  'graph-db': withErrorBoundary(GraphDBNode, 'GraphDBNode'),
  'pub-sub': withErrorBoundary(PubSubNode, 'PubSubNode'),
  'stream-processor': withErrorBoundary(StreamProcessorNode, 'StreamProcessorNode'),
  'batch-processor': withErrorBoundary(BatchProcessorNode, 'BatchProcessorNode'),
  'ml-inference': withErrorBoundary(MLInferenceNode, 'MLInferenceNode'),
  dns: withErrorBoundary(DNSNode, 'DNSNode'),
  'cdn-edge': withErrorBoundary(CDNEdgeNode, 'CDNEdgeNode'),
  firewall: withErrorBoundary(FirewallNode, 'FirewallNode'),
  'mobile-client': withErrorBoundary(MobileClientNode, 'MobileClientNode'),
  'third-party-api': withErrorBoundary(ThirdPartyAPINode, 'ThirdPartyAPINode'),
  'metrics-collector': withErrorBoundary(MetricsCollectorNode, 'MetricsCollectorNode'),
  'log-aggregator': withErrorBoundary(LogAggregatorNode, 'LogAggregatorNode'),
  tracer: withErrorBoundary(DistributedTracerNode, 'DistributedTracerNode'),
  'event-bus': withErrorBoundary(EventBusNode, 'EventBusNode'),
  'rate-limiter': withErrorBoundary(RateLimiterNode, 'RateLimiterNode'),
  'secret-manager': withErrorBoundary(SecretManagerNode, 'SecretManagerNode'),

  // ── Services ──
  'notification-service': withErrorBoundary(NotificationServiceNode, 'NotificationServiceNode'),
  'search-service': withErrorBoundary(SearchServiceNode, 'SearchServiceNode'),
  'analytics-service': withErrorBoundary(AnalyticsServiceNode, 'AnalyticsServiceNode'),
  scheduler: withErrorBoundary(SchedulerNode, 'SchedulerNode'),
  'service-discovery': withErrorBoundary(ServiceDiscoveryNode, 'ServiceDiscoveryNode'),
  'config-service': withErrorBoundary(ConfigServiceNode, 'ConfigServiceNode'),
  'secrets-manager-v2': withErrorBoundary(SecretsManagerV2Node, 'SecretsManagerV2Node'),
  'feature-flags': withErrorBoundary(FeatureFlagsNode, 'FeatureFlagsNode'),
  'auth-service-v2': withErrorBoundary(AuthServiceV2Node, 'AuthServiceV2Node'),

  // ── Networking v2 ──
  vpc: withErrorBoundary(VPCNode, 'VPCNode'),
  subnet: withErrorBoundary(SubnetNode, 'SubnetNode'),
  'nat-gateway': withErrorBoundary(NATGatewayNode, 'NATGatewayNode'),
  'vpn-gateway': withErrorBoundary(VPNGatewayNode, 'VPNGatewayNode'),
  'service-mesh': withErrorBoundary(ServiceMeshNode, 'ServiceMeshNode'),
  'dns-server': withErrorBoundary(DNSServerNode, 'DNSServerNode'),
  'ingress-controller': withErrorBoundary(IngressControllerNode, 'IngressControllerNode'),

  // ── FinTech ──
  'payment-gateway': withErrorBoundary(PaymentGatewayNode, 'PaymentGatewayNode'),
  'ledger-service': withErrorBoundary(LedgerServiceNode, 'LedgerServiceNode'),
  'fraud-detection': withErrorBoundary(FraudDetectionNode, 'FraudDetectionNode'),
  hsm: withErrorBoundary(HSMNode, 'HSMNode'),

  // ── Data Engineering ──
  'etl-pipeline': withErrorBoundary(ETLPipelineNode, 'ETLPipelineNode'),
  'cdc-service': withErrorBoundary(CDCServiceNode, 'CDCServiceNode'),
  'schema-registry': withErrorBoundary(SchemaRegistryNode, 'SchemaRegistryNode'),
  'feature-store': withErrorBoundary(FeatureStoreNode, 'FeatureStoreNode'),
  'media-processor': withErrorBoundary(MediaProcessorNode, 'MediaProcessorNode'),

  // ── AI / LLM ──
  'llm-gateway': withErrorBoundary(LLMGatewayNode, 'LLMGatewayNode'),
  'tool-registry': withErrorBoundary(ToolRegistryNode, 'ToolRegistryNode'),
  'memory-fabric': withErrorBoundary(MemoryFabricNode, 'MemoryFabricNode'),
  'agent-orchestrator': withErrorBoundary(AgentOrchestratorNode, 'AgentOrchestratorNode'),
  'safety-mesh': withErrorBoundary(SafetyMeshNode, 'SafetyMeshNode'),

  // ── Security v2 ──
  'ddos-shield': withErrorBoundary(DDoSShieldNode, 'DDoSShieldNode'),
  siem: withErrorBoundary(SIEMNode, 'SIEMNode'),

  // ── DB Internals ──
  'shard-node': withErrorBoundary(ShardNodeNode, 'ShardNodeNode'),
  'primary-node': withErrorBoundary(PrimaryNodeNode, 'PrimaryNodeNode'),
  'partition-node': withErrorBoundary(PartitionNodeNode, 'PartitionNodeNode'),
  'replica-node': withErrorBoundary(ReplicaNodeNode, 'ReplicaNodeNode'),
  'input-node': withErrorBoundary(InputNodeNode, 'InputNodeNode'),
  'output-node': withErrorBoundary(OutputNodeNode, 'OutputNodeNode'),
  'coordinator-node': withErrorBoundary(CoordinatorNodeNode, 'CoordinatorNodeNode'),
} as const;
