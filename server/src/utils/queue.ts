type JobHandler = (data: any) => Promise<void>;

export class InMemoryQueue {
  private name: string;
  private handlers = new Map<string, JobHandler>();

  constructor(name: string) {
    this.name = name;
    console.log(`Initialized in-memory background queue: [${this.name}]`);
  }

  // Register worker handler for a specific job name
  process(jobName: string, handler: JobHandler) {
    this.handlers.set(jobName, handler);
    console.log(`Registered background worker for job: [${this.name} -> ${jobName}]`);
  }

  // Add job to queue (processed asynchronously)
  async add(jobName: string, data: any) {
    const handler = this.handlers.get(jobName);
    
    // Defer execution using setImmediate / setTimeout to mimic queue background processing
    setImmediate(async () => {
      console.log(`[Queue: ${this.name}] Processing job: ${jobName}...`);
      try {
        if (handler) {
          await handler(data);
          console.log(`[Queue: ${this.name}] Job ${jobName} completed successfully.`);
        } else {
          console.warn(`[Queue: ${this.name}] No handler registered for job: ${jobName}`);
        }
      } catch (error) {
        console.error(`[Queue: ${this.name}] Job ${jobName} failed:`, error);
      }
    });

    return { id: Math.random().toString(36).substr(2, 9) };
  }
}

// Global queue instances (mirroring BullMQ queues)
export const mailQueue = new InMemoryQueue('MailQueue');
export const aiQueue = new InMemoryQueue('AIQueue');

// Initialize worker listeners
mailQueue.process('sendWelcomeEmail', async (data: { email: string; name: string }) => {
  console.log(`[Worker] Sending welcome email to: ${data.email} (${data.name})`);
  // Mock SMTP sending block
});

mailQueue.process('sendComplaintAlert', async (data: { email: string; complaintTitle: string }) => {
  console.log(`[Worker] Sending complaint notification alert to: ${data.email} for "${data.complaintTitle}"`);
});
