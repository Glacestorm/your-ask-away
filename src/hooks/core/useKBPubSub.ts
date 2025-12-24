/**
 * KB 4.5 - Pub/Sub Pattern
 * Phase 19: Advanced State & Communication
 * 
 * Features:
 * - Topic-based messaging
 * - Message persistence
 * - Delivery guarantees
 * - Message acknowledgment
 * - Batching & buffering
 * - Consumer groups
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type DeliveryGuarantee = 'at-most-once' | 'at-least-once' | 'exactly-once';

export interface PubSubMessage<T = unknown> {
  id: string;
  topic: string;
  payload: T;
  timestamp: number;
  publisherId: string;
  sequenceNumber: number;
  headers?: Record<string, string>;
  expiresAt?: number;
  retryCount?: number;
}

export interface Subscription {
  id: string;
  topic: string;
  handler: MessageHandler<unknown>;
  options: SubscriptionOptions;
  consumerGroup?: string;
  createdAt: number;
  lastMessageAt: number | null;
  messagesReceived: number;
}

export interface SubscriptionOptions {
  deliveryGuarantee?: DeliveryGuarantee;
  ackTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  batchTimeout?: number;
  filter?: (message: PubSubMessage) => boolean;
  transform?: (message: PubSubMessage) => PubSubMessage;
}

export type MessageHandler<T> = (
  message: PubSubMessage<T>,
  ack: () => void,
  nack: (requeue?: boolean) => void
) => void | Promise<void>;

export interface ConsumerGroup {
  id: string;
  name: string;
  subscribers: string[];
  strategy: 'round-robin' | 'broadcast' | 'random';
  currentIndex: number;
}

export interface TopicConfig {
  name: string;
  retentionMs?: number;
  maxMessages?: number;
  partitions?: number;
  replicationFactor?: number;
}

export interface PubSubConfig {
  publisherId?: string;
  enablePersistence?: boolean;
  persistenceKey?: string;
  defaultDeliveryGuarantee?: DeliveryGuarantee;
  defaultAckTimeout?: number;
  maxPendingMessages?: number;
  enableMetrics?: boolean;
  onDeadLetter?: (message: PubSubMessage, error: Error) => void;
}

export interface PendingMessage {
  message: PubSubMessage;
  subscription: Subscription;
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  ackDeadline: number;
}

export interface PubSubMetrics {
  messagesPublished: number;
  messagesDelivered: number;
  messagesAcked: number;
  messagesNacked: number;
  messagesExpired: number;
  deadLetterCount: number;
  activeSubscriptions: number;
  topicCount: number;
  avgDeliveryTime: number;
}

// =============================================================================
// UTILITIES
// =============================================================================

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// =============================================================================
// PUB/SUB ENGINE
// =============================================================================

class PubSubEngine {
  private subscriptions = new Map<string, Subscription>();
  private topics = new Map<string, TopicConfig>();
  private consumerGroups = new Map<string, ConsumerGroup>();
  private messageStore = new Map<string, PubSubMessage[]>();
  private pendingMessages = new Map<string, PendingMessage>();
  private sequenceNumbers = new Map<string, number>();
  private deliveredMessageIds = new Set<string>();
  private config: Required<PubSubConfig>;
  private metrics: PubSubMetrics;
  private deliveryTimes: number[] = [];

  constructor(config: PubSubConfig = {}) {
    this.config = {
      publisherId: config.publisherId || `pub_${generateId()}`,
      enablePersistence: config.enablePersistence ?? false,
      persistenceKey: config.persistenceKey ?? 'kb_pubsub',
      defaultDeliveryGuarantee: config.defaultDeliveryGuarantee ?? 'at-least-once',
      defaultAckTimeout: config.defaultAckTimeout ?? 30000,
      maxPendingMessages: config.maxPendingMessages ?? 1000,
      enableMetrics: config.enableMetrics ?? true,
      onDeadLetter: config.onDeadLetter ?? console.error,
    };

    this.metrics = {
      messagesPublished: 0,
      messagesDelivered: 0,
      messagesAcked: 0,
      messagesNacked: 0,
      messagesExpired: 0,
      deadLetterCount: 0,
      activeSubscriptions: 0,
      topicCount: 0,
      avgDeliveryTime: 0,
    };

    this.loadFromPersistence();
    this.startAckMonitor();
  }

  private loadFromPersistence(): void {
    if (!this.config.enablePersistence) return;

    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.messageStore) {
          Object.entries(data.messageStore).forEach(([topic, messages]) => {
            this.messageStore.set(topic, messages as PubSubMessage[]);
          });
        }
        if (data.deliveredMessageIds) {
          data.deliveredMessageIds.forEach((id: string) => {
            this.deliveredMessageIds.add(id);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load PubSub state:', e);
    }
  }

  private saveToPersistence(): void {
    if (!this.config.enablePersistence) return;

    try {
      const data = {
        messageStore: Object.fromEntries(this.messageStore),
        deliveredMessageIds: Array.from(this.deliveredMessageIds).slice(-1000),
      };
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save PubSub state:', e);
    }
  }

  private startAckMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      
      this.pendingMessages.forEach((pending, key) => {
        if (now >= pending.ackDeadline) {
          this.handleAckTimeout(key, pending);
        }
      });
    }, 1000);
  }

  private handleAckTimeout(key: string, pending: PendingMessage): void {
    const { maxRetries = 3 } = pending.subscription.options;
    
    if (pending.attempts >= maxRetries) {
      // Dead letter
      this.config.onDeadLetter(pending.message, new Error('Max retries exceeded'));
      this.metrics.deadLetterCount++;
      this.pendingMessages.delete(key);
    } else {
      // Retry
      pending.attempts++;
      pending.lastAttemptAt = Date.now();
      pending.ackDeadline = Date.now() + (pending.subscription.options.ackTimeout || this.config.defaultAckTimeout);
      
      this.deliverMessage(pending.message, pending.subscription);
    }
  }

  private getNextSequenceNumber(topic: string): number {
    const current = this.sequenceNumbers.get(topic) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(topic, next);
    return next;
  }

  createTopic(config: TopicConfig): void {
    this.topics.set(config.name, {
      retentionMs: config.retentionMs ?? 7 * 24 * 60 * 60 * 1000,
      maxMessages: config.maxMessages ?? 10000,
      ...config,
    });
    this.messageStore.set(config.name, []);
    this.metrics.topicCount = this.topics.size;
  }

  deleteTopic(name: string): void {
    this.topics.delete(name);
    this.messageStore.delete(name);
    
    // Remove subscriptions for this topic
    this.subscriptions.forEach((sub, id) => {
      if (sub.topic === name) {
        this.subscriptions.delete(id);
      }
    });
    
    this.metrics.topicCount = this.topics.size;
    this.metrics.activeSubscriptions = this.subscriptions.size;
  }

  createConsumerGroup(name: string, strategy: ConsumerGroup['strategy'] = 'round-robin'): string {
    const id = `cg_${generateId()}`;
    this.consumerGroups.set(id, {
      id,
      name,
      subscribers: [],
      strategy,
      currentIndex: 0,
    });
    return id;
  }

  subscribe<T>(
    topic: string,
    handler: MessageHandler<T>,
    options: SubscriptionOptions & { consumerGroup?: string } = {}
  ): () => void {
    const id = `sub_${generateId()}`;
    
    const subscription: Subscription = {
      id,
      topic,
      handler: handler as MessageHandler<unknown>,
      options: {
        deliveryGuarantee: options.deliveryGuarantee || this.config.defaultDeliveryGuarantee,
        ackTimeout: options.ackTimeout || this.config.defaultAckTimeout,
        maxRetries: options.maxRetries ?? 3,
        retryDelay: options.retryDelay ?? 1000,
        ...options,
      },
      consumerGroup: options.consumerGroup,
      createdAt: Date.now(),
      lastMessageAt: null,
      messagesReceived: 0,
    };

    this.subscriptions.set(id, subscription);
    this.metrics.activeSubscriptions = this.subscriptions.size;

    // Add to consumer group if specified
    if (options.consumerGroup) {
      const group = this.consumerGroups.get(options.consumerGroup);
      if (group) {
        group.subscribers.push(id);
      }
    }

    return () => {
      this.subscriptions.delete(id);
      this.metrics.activeSubscriptions = this.subscriptions.size;

      // Remove from consumer group
      if (options.consumerGroup) {
        const group = this.consumerGroups.get(options.consumerGroup);
        if (group) {
          group.subscribers = group.subscribers.filter(s => s !== id);
        }
      }
    };
  }

  async publish<T>(
    topic: string,
    payload: T,
    options: Partial<Pick<PubSubMessage, 'headers' | 'expiresAt'>> = {}
  ): Promise<string> {
    const message: PubSubMessage<T> = {
      id: `msg_${generateId()}`,
      topic,
      payload,
      timestamp: Date.now(),
      publisherId: this.config.publisherId,
      sequenceNumber: this.getNextSequenceNumber(topic),
      headers: options.headers,
      expiresAt: options.expiresAt,
      retryCount: 0,
    };

    // Store message
    const topicMessages = this.messageStore.get(topic) || [];
    topicMessages.push(message as PubSubMessage);
    
    // Apply retention
    const topicConfig = this.topics.get(topic);
    if (topicConfig?.maxMessages && topicMessages.length > topicConfig.maxMessages) {
      topicMessages.shift();
    }
    
    this.messageStore.set(topic, topicMessages);
    this.metrics.messagesPublished++;

    // Deliver to subscribers
    this.deliverToSubscribers(message as PubSubMessage);
    
    this.saveToPersistence();
    return message.id;
  }

  private deliverToSubscribers(message: PubSubMessage): void {
    const startTime = performance.now();
    
    // Group subscriptions by consumer group
    const subscriptionsByGroup = new Map<string | undefined, Subscription[]>();
    
    this.subscriptions.forEach(sub => {
      if (sub.topic === message.topic) {
        const groupId = sub.consumerGroup;
        if (!subscriptionsByGroup.has(groupId)) {
          subscriptionsByGroup.set(groupId, []);
        }
        subscriptionsByGroup.get(groupId)!.push(sub);
      }
    });

    subscriptionsByGroup.forEach((subs, groupId) => {
      if (groupId) {
        // Consumer group - select one subscriber
        const group = this.consumerGroups.get(groupId);
        if (group && subs.length > 0) {
          let selectedSub: Subscription;
          
          switch (group.strategy) {
            case 'round-robin':
              selectedSub = subs[group.currentIndex % subs.length];
              group.currentIndex++;
              break;
            case 'random':
              selectedSub = subs[Math.floor(Math.random() * subs.length)];
              break;
            case 'broadcast':
            default:
              subs.forEach(sub => this.deliverMessage(message, sub));
              return;
          }
          
          this.deliverMessage(message, selectedSub);
        }
      } else {
        // No consumer group - deliver to all
        subs.forEach(sub => this.deliverMessage(message, sub));
      }
    });

    const deliveryTime = performance.now() - startTime;
    this.deliveryTimes.push(deliveryTime);
    if (this.deliveryTimes.length > 100) this.deliveryTimes.shift();
    this.metrics.avgDeliveryTime = 
      this.deliveryTimes.reduce((a, b) => a + b, 0) / this.deliveryTimes.length;
  }

  private async deliverMessage(message: PubSubMessage, subscription: Subscription): Promise<void> {
    const { options } = subscription;
    
    // Check if expired
    if (message.expiresAt && Date.now() > message.expiresAt) {
      this.metrics.messagesExpired++;
      return;
    }

    // Check exactly-once delivery
    if (options.deliveryGuarantee === 'exactly-once') {
      const deliveryKey = `${subscription.id}:${message.id}`;
      if (this.deliveredMessageIds.has(deliveryKey)) {
        return; // Already delivered
      }
      this.deliveredMessageIds.add(deliveryKey);
    }

    // Apply filter
    if (options.filter && !options.filter(message)) {
      return;
    }

    // Apply transform
    let messageToDeliver = message;
    if (options.transform) {
      messageToDeliver = options.transform(message);
    }

    const pendingKey = `${subscription.id}:${message.id}`;
    
    // Track pending for at-least-once and exactly-once
    if (options.deliveryGuarantee !== 'at-most-once') {
      this.pendingMessages.set(pendingKey, {
        message: messageToDeliver,
        subscription,
        attempts: 1,
        firstAttemptAt: Date.now(),
        lastAttemptAt: Date.now(),
        ackDeadline: Date.now() + (options.ackTimeout || this.config.defaultAckTimeout),
      });
    }

    const ack = () => {
      this.pendingMessages.delete(pendingKey);
      this.metrics.messagesAcked++;
    };

    const nack = (requeue = true) => {
      this.metrics.messagesNacked++;
      
      if (requeue) {
        const pending = this.pendingMessages.get(pendingKey);
        if (pending) {
          setTimeout(() => {
            this.handleAckTimeout(pendingKey, pending);
          }, options.retryDelay || 1000);
        }
      } else {
        this.pendingMessages.delete(pendingKey);
      }
    };

    try {
      await subscription.handler(messageToDeliver, ack, nack);
      subscription.lastMessageAt = Date.now();
      subscription.messagesReceived++;
      this.metrics.messagesDelivered++;

      // Auto-ack for at-most-once
      if (options.deliveryGuarantee === 'at-most-once') {
        ack();
      }
    } catch (error) {
      nack(true);
    }
  }

  getMessages(topic: string, options?: { 
    fromSequence?: number; 
    limit?: number;
    fromTimestamp?: number;
  }): PubSubMessage[] {
    const messages = this.messageStore.get(topic) || [];
    let filtered = messages;

    if (options?.fromSequence) {
      filtered = filtered.filter(m => m.sequenceNumber > options.fromSequence!);
    }

    if (options?.fromTimestamp) {
      filtered = filtered.filter(m => m.timestamp > options.fromTimestamp!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getMetrics(): PubSubMetrics {
    return { ...this.metrics };
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  getTopics(): TopicConfig[] {
    return Array.from(this.topics.values());
  }

  clear(): void {
    this.messageStore.clear();
    this.pendingMessages.clear();
    this.deliveredMessageIds.clear();
    this.sequenceNumbers.clear();
    this.saveToPersistence();
  }
}

// Global instance
let globalPubSub: PubSubEngine | null = null;

export const getPubSub = (config?: PubSubConfig): PubSubEngine => {
  if (!globalPubSub) {
    globalPubSub = new PubSubEngine(config);
  }
  return globalPubSub;
};

export const resetPubSub = (): void => {
  globalPubSub = null;
};

// =============================================================================
// HOOKS
// =============================================================================

export function useKBPubSub(config?: PubSubConfig) {
  const pubsub = useMemo(() => getPubSub(config), []);
  const [metrics, setMetrics] = useState<PubSubMetrics>(pubsub.getMetrics());

  const publish = useCallback(<T>(
    topic: string,
    payload: T,
    options?: Partial<Pick<PubSubMessage, 'headers' | 'expiresAt'>>
  ) => {
    return pubsub.publish(topic, payload, options);
  }, [pubsub]);

  const subscribe = useCallback(<T>(
    topic: string,
    handler: MessageHandler<T>,
    options?: SubscriptionOptions & { consumerGroup?: string }
  ) => {
    return pubsub.subscribe(topic, handler, options);
  }, [pubsub]);

  const createTopic = useCallback((config: TopicConfig) => {
    pubsub.createTopic(config);
  }, [pubsub]);

  const deleteTopic = useCallback((name: string) => {
    pubsub.deleteTopic(name);
  }, [pubsub]);

  const createConsumerGroup = useCallback((
    name: string,
    strategy?: ConsumerGroup['strategy']
  ) => {
    return pubsub.createConsumerGroup(name, strategy);
  }, [pubsub]);

  // Refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(pubsub.getMetrics());
    }, 5000);
    return () => clearInterval(interval);
  }, [pubsub]);

  return {
    publish,
    subscribe,
    createTopic,
    deleteTopic,
    createConsumerGroup,
    getMessages: (topic: string, options?: { fromSequence?: number; limit?: number }) => 
      pubsub.getMessages(topic, options),
    getSubscriptions: () => pubsub.getSubscriptions(),
    getTopics: () => pubsub.getTopics(),
    metrics,
    clear: () => pubsub.clear(),
  };
}

export function useKBTopic<T>(topic: string, options?: SubscriptionOptions) {
  const pubsub = getPubSub();
  const [messages, setMessages] = useState<PubSubMessage<T>[]>([]);
  const [lastMessage, setLastMessage] = useState<PubSubMessage<T> | null>(null);

  useEffect(() => {
    const unsubscribe = pubsub.subscribe<T>(
      topic,
      (message, ack) => {
        setMessages(prev => [...prev.slice(-99), message]);
        setLastMessage(message);
        ack();
      },
      options
    );

    return unsubscribe;
  }, [topic]);

  const publish = useCallback((payload: T) => {
    return pubsub.publish(topic, payload);
  }, [topic, pubsub]);

  return {
    messages,
    lastMessage,
    publish,
    clear: () => setMessages([]),
  };
}

export function useKBPublisher<T>(topic: string) {
  const pubsub = getPubSub();
  const [publishCount, setPublishCount] = useState(0);

  const publish = useCallback(async (
    payload: T,
    options?: Partial<Pick<PubSubMessage, 'headers' | 'expiresAt'>>
  ) => {
    const id = await pubsub.publish(topic, payload, options);
    setPublishCount(c => c + 1);
    return id;
  }, [topic, pubsub]);

  const publishBatch = useCallback(async (
    payloads: T[],
    options?: Partial<Pick<PubSubMessage, 'headers' | 'expiresAt'>>
  ) => {
    const ids = await Promise.all(
      payloads.map(payload => pubsub.publish(topic, payload, options))
    );
    setPublishCount(c => c + payloads.length);
    return ids;
  }, [topic, pubsub]);

  return {
    publish,
    publishBatch,
    publishCount,
  };
}

export function useKBSubscriber<T>(
  topic: string,
  handler: (payload: T, message: PubSubMessage<T>) => void,
  options?: SubscriptionOptions,
  deps: React.DependencyList = []
) {
  const pubsub = getPubSub();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const unsubscribe = pubsub.subscribe<T>(
      topic,
      (message, ack) => {
        handlerRef.current(message.payload, message);
        setMessageCount(c => c + 1);
        ack();
      },
      options
    );

    return unsubscribe;
  }, [topic, ...deps]);

  return { messageCount };
}

export default useKBPubSub;
