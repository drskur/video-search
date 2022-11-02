import { Construct } from "constructs";
import { Queue } from "aws-cdk-lib/aws-sqs";

export class SubtitleJobQueue extends Construct {
  public readonly queue: Queue;
  public readonly dlq: Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.dlq = new Queue(this, "Dlq");

    this.queue = new Queue(this, "Queue", {
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3,
      },
    });
  }
}
