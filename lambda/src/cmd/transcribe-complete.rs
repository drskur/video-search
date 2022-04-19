use aws_lambda_events::event::cloudwatch_events::CloudWatchEvent;
use aws_sdk_dynamodb::model::AttributeValue;
use chrono::Utc;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use serde::Deserialize;
use lib::subtitle::SubtitleQueueMessage;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct TranscribeDetail {
    #[serde(rename = "TranscriptionJobName")]
    transcription_job_name: String,
    #[serde(rename = "TranscriptionJobStatus")]
    transcription_job_status: String
}

async fn handler(event: LambdaEvent<CloudWatchEvent>) -> Result<(), Error> {

    let detail_value = event.payload.detail.expect("detail must be exist");
    let detail = serde_json::from_value::<TranscribeDetail>(detail_value)?;
    let transcript_key = format!("transcription/{}", detail.transcription_job_name);

    let table_name = dotenv::var("DYNAMODB_TABLE_NAME")
        .expect("DYNAMODB_TABLE_NAME must be set.");

    let queue_url = dotenv::var("QUEUE_URL")
        .expect("QUEUE_URL must be set.");

    let shared_config = aws_config::from_env()
        .load().await;

    let dynamodb = aws_sdk_dynamodb::Client::new(&shared_config);
    dynamodb.update_item()
        .table_name(&table_name)
        .key("id", AttributeValue::S(detail.transcription_job_name.clone()))
        .update_expression("SET transcription_at = :at, transcription_key = :key")
        .expression_attribute_values(":at", AttributeValue::S(Utc::now().to_string()))
        .expression_attribute_values(":key", AttributeValue::S(transcript_key))
        .send()
        .await
        .unwrap();

    let output = dynamodb.get_item()
        .table_name(&table_name)
        .key("id", AttributeValue::S(detail.transcription_job_name.clone()))
        .send()
        .await
        .unwrap();

    let item = output.item.unwrap();
    let lang = item.get("lang")
        .and_then(|v| v.as_s().ok())
        .map(|s| s.split("-").collect::<Vec<_>>())
        .unwrap();

    let queue_message = SubtitleQueueMessage::new(
        &detail.transcription_job_name,
        lang[0],
        None
    );

    let sqs = aws_sdk_sqs::Client::new(&shared_config);
    sqs.send_message()
        .queue_url(queue_url)
        .message_body(serde_json::to_string(&queue_message).unwrap())
        .send()
        .await
        .unwrap();

    Ok(())
}
