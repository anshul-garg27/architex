import { describe, it, expect } from 'vitest';
import {
  matchArchitecture,
  generateArchitecture,
  getArchitecture,
  getAvailableArchitectures,
  type ArchitectureKey,
} from '@/lib/ai/architecture-generator';

describe('architecture-generator', () => {
  // ── matchArchitecture — keyword matching ─────────────────────

  describe('matchArchitecture', () => {
    it('matches "url shortener" to url-shortener', () => {
      expect(matchArchitecture('Design a URL shortener')).toBe('url-shortener');
    });

    it('matches "bitly" to url-shortener', () => {
      expect(matchArchitecture('Build something like Bitly')).toBe('url-shortener');
    });

    it('matches "chat app" to chat-app', () => {
      expect(matchArchitecture('Real-time chat application')).toBe('chat-app');
    });

    it('matches "whatsapp" to chat-app', () => {
      expect(matchArchitecture('Design WhatsApp')).toBe('chat-app');
    });

    it('matches "slack messaging" to chat-app', () => {
      expect(matchArchitecture('Build a Slack-like messaging platform')).toBe('chat-app');
    });

    it('matches "social feed" to social-feed', () => {
      expect(matchArchitecture('Build a social media feed')).toBe('social-feed');
    });

    it('matches "twitter timeline" to social-feed', () => {
      expect(matchArchitecture('Design Twitter timeline')).toBe('social-feed');
    });

    it('matches "instagram newsfeed" to social-feed', () => {
      expect(matchArchitecture('Instagram newsfeed design')).toBe('social-feed');
    });

    it('matches "e-commerce" to e-commerce', () => {
      expect(matchArchitecture('Design an e-commerce platform')).toBe('e-commerce');
    });

    it('matches "shopping cart" to e-commerce', () => {
      expect(matchArchitecture('Build a shopping cart system')).toBe('e-commerce');
    });

    it('matches "amazon marketplace" to e-commerce', () => {
      expect(matchArchitecture('Amazon-like marketplace')).toBe('e-commerce');
    });

    it('matches "video streaming" to video-streaming', () => {
      expect(matchArchitecture('Build a video streaming service')).toBe('video-streaming');
    });

    it('matches "youtube" to video-streaming', () => {
      expect(matchArchitecture('Design YouTube')).toBe('video-streaming');
    });

    it('matches "netflix" to video-streaming', () => {
      expect(matchArchitecture('Netflix-like streaming')).toBe('video-streaming');
    });

    it('matches "ride sharing" to ride-sharing', () => {
      expect(matchArchitecture('Design a ride sharing app')).toBe('ride-sharing');
    });

    it('matches "uber" to ride-sharing', () => {
      expect(matchArchitecture('Design Uber')).toBe('ride-sharing');
    });

    it('matches "taxi dispatch" to ride-sharing', () => {
      expect(matchArchitecture('Taxi dispatch system')).toBe('ride-sharing');
    });

    it('matches "payment system" to payment-system', () => {
      expect(matchArchitecture('Design a payment system')).toBe('payment-system');
    });

    it('matches "stripe billing" to payment-system', () => {
      expect(matchArchitecture('Build a Stripe-like billing')).toBe('payment-system');
    });

    it('matches "notification service" to notification-service', () => {
      expect(matchArchitecture('Design a notification service')).toBe('notification-service');
    });

    it('matches "push notifications" to notification-service', () => {
      expect(matchArchitecture('Push notification system')).toBe('notification-service');
    });

    it('matches "email and SMS alerts" to notification-service', () => {
      expect(matchArchitecture('Build email and SMS alert system')).toBe('notification-service');
    });

    it('returns null for unrecognised descriptions', () => {
      expect(matchArchitecture('Design a quantum computer simulator')).toBeNull();
    });

    it('is case-insensitive', () => {
      expect(matchArchitecture('DESIGN A URL SHORTENER')).toBe('url-shortener');
    });

    it('prefers more specific matches (longer keywords)', () => {
      // "real-time message" is more specific than "message" alone
      const result = matchArchitecture('real-time message system');
      expect(result).toBe('chat-app');
    });
  });

  // ── generateArchitecture ────────────────────────────────────

  describe('generateArchitecture', () => {
    it('returns a valid architecture for a known description', () => {
      const arch = generateArchitecture('Design a URL shortener');
      expect(arch.name).toBe('URL Shortener');
      expect(arch.nodes.length).toBeGreaterThan(0);
      expect(arch.edges.length).toBeGreaterThan(0);
      expect(arch.reasoning).toBeTruthy();
    });

    it('returns a fallback for an unknown description', () => {
      const arch = generateArchitecture('Build a quantum entanglement router');
      expect(arch.name).toBe('Generic Service');
      expect(arch.reasoning).toContain('No specific architecture matched');
    });

    it('all nodes have required fields', () => {
      const arch = generateArchitecture('Design a chat application');
      for (const node of arch.nodes) {
        expect(node.id).toBeTruthy();
        expect(node.label).toBeTruthy();
        expect(node.category).toBeTruthy();
        expect(node.componentType).toBeTruthy();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      }
    });

    it('all edges reference existing node IDs', () => {
      const arch = generateArchitecture('Design an e-commerce platform');
      const nodeIds = new Set(arch.nodes.map((n) => n.id));
      for (const edge of arch.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    });

    it('edge types are valid EdgeType values', () => {
      const validTypes = new Set([
        'http', 'grpc', 'graphql', 'websocket',
        'message-queue', 'event-stream', 'db-query',
        'cache-lookup', 'replication',
      ]);
      const arch = generateArchitecture('Design a payment system');
      for (const edge of arch.edges) {
        expect(validTypes.has(edge.edgeType)).toBe(true);
      }
    });
  });

  // ── getArchitecture ─────────────────────────────────────────

  describe('getArchitecture', () => {
    it('returns the correct architecture by key', () => {
      const arch = getArchitecture('chat-app');
      expect(arch.name).toBe('Chat Application');
    });

    it('each architecture has unique node IDs', () => {
      const keys = getAvailableArchitectures();
      for (const key of keys) {
        const arch = getArchitecture(key);
        const ids = arch.nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('each architecture has unique edge IDs', () => {
      const keys = getAvailableArchitectures();
      for (const key of keys) {
        const arch = getArchitecture(key);
        const ids = arch.edges.map((e) => e.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });
  });

  // ── getAvailableArchitectures ───────────────────────────────

  describe('getAvailableArchitectures', () => {
    it('returns all 8 architecture keys', () => {
      const keys = getAvailableArchitectures();
      expect(keys).toHaveLength(8);
      expect(keys).toContain('url-shortener');
      expect(keys).toContain('chat-app');
      expect(keys).toContain('social-feed');
      expect(keys).toContain('e-commerce');
      expect(keys).toContain('video-streaming');
      expect(keys).toContain('ride-sharing');
      expect(keys).toContain('payment-system');
      expect(keys).toContain('notification-service');
    });
  });
});
