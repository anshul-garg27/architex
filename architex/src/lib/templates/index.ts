import type { DiagramTemplate } from './types';

import urlShortener from '../../../templates/system-design/url-shortener.json';
import twitterFanout from '../../../templates/system-design/twitter-fanout.json';
import netflixCdn from '../../../templates/system-design/netflix-cdn.json';
import uberDispatch from '../../../templates/system-design/uber-dispatch.json';
import rateLimiter from '../../../templates/system-design/rate-limiter.json';
import chatSystem from '../../../templates/system-design/chat-system.json';
import notificationSystem from '../../../templates/system-design/notification-system.json';
import searchEngine from '../../../templates/system-design/search-engine.json';
import paymentSystem from '../../../templates/system-design/payment-system.json';
import instagram from '../../../templates/system-design/instagram.json';
import discord from '../../../templates/system-design/discord.json';
import spotify from '../../../templates/system-design/spotify.json';
import youtube from '../../../templates/system-design/youtube.json';
import googleSearch from '../../../templates/system-design/google-search.json';
import distributedKv from '../../../templates/system-design/distributed-kv.json';
import webCrawler from '../../../templates/system-design/web-crawler.json';
import typeahead from '../../../templates/system-design/typeahead.json';
import ciCdPipeline from '../../../templates/system-design/ci-cd-pipeline.json';
import metricsMonitoring from '../../../templates/system-design/metrics-monitoring.json';
import foodDelivery from '../../../templates/system-design/food-delivery.json';
import hotelReservation from '../../../templates/system-design/hotel-reservation.json';
import ticketBooking from '../../../templates/system-design/ticket-booking.json';
import stockExchange from '../../../templates/system-design/stock-exchange.json';
import featureFlags from '../../../templates/system-design/feature-flags.json';
import loggingSystem from '../../../templates/system-design/logging-system.json';
import emailService from '../../../templates/system-design/email-service.json';
import videoProcessing from '../../../templates/system-design/video-processing.json';
import socialFeed from '../../../templates/system-design/social-feed.json';
import apiRateLimiter from '../../../templates/system-design/api-rate-limiter.json';
import collaborativeEditor from '../../../templates/system-design/collaborative-editor.json';
import gamingBackend from '../../../templates/system-design/gaming-backend.json';
import iotPlatform from '../../../templates/system-design/iot-platform.json';
import contentModeration from '../../../templates/system-design/content-moderation.json';
import authenticationSystem from '../../../templates/system-design/authentication-system.json';
import workflowEngine from '../../../templates/system-design/workflow-engine.json';
import dataLake from '../../../templates/system-design/data-lake.json';
import pushNotification from '../../../templates/system-design/push-notification.json';
import urlAnalytics from '../../../templates/system-design/url-analytics.json';
import imageCdn from '../../../templates/system-design/image-cdn.json';
import microservicesDemo from '../../../templates/system-design/microservices-demo.json';
import rideSharing from '../../../templates/system-design/ride-sharing.json';
import socialLogin from '../../../templates/system-design/social-login.json';
import recommendationEngine from '../../../templates/system-design/recommendation-engine.json';
import inventorySystem from '../../../templates/system-design/inventory-system.json';
import dnsSystem from '../../../templates/system-design/dns-system.json';
import logAnalytics from '../../../templates/system-design/log-analytics.json';
import paymentGateway from '../../../templates/system-design/payment-gateway.json';
import realTimeChatV2 from '../../../templates/system-design/real-time-chat-v2.json';
import eventSourcing from '../../../templates/system-design/event-sourcing.json';
import mlPipelineInfra from '../../../templates/system-design/ml-pipeline-infra.json';
import distributedCache from '../../../templates/system-design/distributed-cache.json';
import taskQueue from '../../../templates/system-design/task-queue.json';
import monitoringAlerting from '../../../templates/system-design/monitoring-alerting.json';
import abTestingPlatform from '../../../templates/system-design/ab-testing-platform.json';
import searchAutocomplete from '../../../templates/system-design/search-autocomplete.json';

// Solution Blueprints (v2 — with full simulation metadata + rationale)
import bpUrlShortener from './blueprints/url-shortener-blueprint.json';
import bpBankingSystem from './blueprints/banking-system-blueprint.json';
import bpRidesharing from './blueprints/ridesharing-blueprint.json';
import bpVideoStreaming from './blueprints/video-streaming-blueprint.json';
import bpAiAgent from './blueprints/ai-agent-blueprint.json';
import bpSocialFeed from './blueprints/social-feed-blueprint.json';
import bpChatSystem from './blueprints/chat-system-blueprint.json';
import bpEcommerce from './blueprints/ecommerce-blueprint.json';
import bpAnalyticsPipeline from './blueprints/analytics-pipeline-blueprint.json';
import bpMlPipeline from './blueprints/ml-pipeline-blueprint.json';
import bpIotPlatform from './blueprints/iot-platform-blueprint.json';
import bpCicdPipeline from './blueprints/cicd-pipeline-blueprint.json';
import bpMultiRegion from './blueprints/multi-region-blueprint.json';
import bpEventDriven from './blueprints/event-driven-blueprint.json';
import bpGamingBackend from './blueprints/gaming-backend-blueprint.json';

export type {
  DiagramTemplate,
  TemplateNode,
  TemplateEdge,
  LearnStep,
  SimulationMetadata,
  ChaosScenario,
  BottleneckStage,
  ExpectedIssue,
  CostBreakdown,
  PerformanceTargets,
  ScalingPolicy,
  SLADefinition,
  MonitoringConfig,
  IncidentPlaybook,
  EngineeringRationale,
} from './types';

/**
 * All built-in system design diagram templates.
 * Sorted by difficulty (ascending) then name.
 */
export const SYSTEM_DESIGN_TEMPLATES: DiagramTemplate[] = [
  urlShortener,
  typeahead,
  apiRateLimiter,
  featureFlags,
  twitterFanout,
  webCrawler,
  rateLimiter,
  ciCdPipeline,
  metricsMonitoring,
  hotelReservation,
  emailService,
  loggingSystem,
  chatSystem,
  notificationSystem,
  searchEngine,
  paymentSystem,
  netflixCdn,
  uberDispatch,
  ticketBooking,
  videoProcessing,
  socialFeed,
  instagram,
  discord,
  spotify,
  foodDelivery,
  youtube,
  googleSearch,
  stockExchange,
  collaborativeEditor,
  distributedKv,
  authenticationSystem,
  pushNotification,
  urlAnalytics,
  imageCdn,
  contentModeration,
  microservicesDemo,
  workflowEngine,
  gamingBackend,
  iotPlatform,
  dataLake,
  rideSharing,
  socialLogin,
  inventorySystem,
  dnsSystem,
  recommendationEngine,
  paymentGateway,
  realTimeChatV2,
  logAnalytics,
  eventSourcing,
  mlPipelineInfra,
  distributedCache,
  taskQueue,
  monitoringAlerting,
  abTestingPlatform,
  searchAutocomplete,
] as unknown as DiagramTemplate[];

/**
 * All v2 solution blueprints with full simulation metadata and engineering rationale.
 */
export const SOLUTION_BLUEPRINTS: DiagramTemplate[] = [
  bpUrlShortener,
  bpBankingSystem,
  bpRidesharing,
  bpVideoStreaming,
  bpAiAgent,
  bpSocialFeed,
  bpChatSystem,
  bpEcommerce,
  bpAnalyticsPipeline,
  bpMlPipeline,
  bpIotPlatform,
  bpCicdPipeline,
  bpMultiRegion,
  bpEventDriven,
  bpGamingBackend,
] as unknown as DiagramTemplate[];

/** Look up a single template by its unique ID (searches both templates and blueprints). */
export function getTemplateById(id: string): DiagramTemplate | undefined {
  return (
    SYSTEM_DESIGN_TEMPLATES.find((t) => t.id === id) ??
    SOLUTION_BLUEPRINTS.find((t) => t.id === id)
  );
}

/** Return all templates that match the given category. */
export function getTemplatesByCategory(
  category: DiagramTemplate['category'],
): DiagramTemplate[] {
  return SYSTEM_DESIGN_TEMPLATES.filter((t) => t.category === category);
}

/** Return all templates at or below the given difficulty level. */
export function getTemplatesByDifficulty(difficulty: number): DiagramTemplate[] {
  return SYSTEM_DESIGN_TEMPLATES.filter((t) => t.difficulty <= difficulty);
}

/** Return all solution blueprints (v2 templates with simulation metadata). */
export function getSolutionBlueprints(): DiagramTemplate[] {
  return SOLUTION_BLUEPRINTS;
}

/** Return a specific blueprint by ID. */
export function getBlueprintById(id: string): DiagramTemplate | undefined {
  return SOLUTION_BLUEPRINTS.find((t) => t.id === id);
}
