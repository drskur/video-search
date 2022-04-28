use aws_lambda_events::event::sns::SnsEvent;
use aws_sdk_kendra::model::{Document, DocumentAttribute, DocumentAttributeValue};
use aws_sdk_kendra::types::Blob;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use lib::index::IndexTopicMessage;
use lib::store::video::get_video;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

async fn handler(event: LambdaEvent<SnsEvent>) -> Result<(), Error> {

    println!("{:?}", serde_json::to_string(&event.payload).unwrap());

    let kendra_index = dotenv::var("KENDRA_INDEX")
        .expect("KENDRA_INDEX must be set.");
    let shared_config = aws_config::from_env()
        .load().await;

    let kendra = aws_sdk_kendra::Client::new(&shared_config);

    for record in event.payload.records {
        let message = record.sns.message.expect("message body must be exist");
        let msg = serde_json::from_str::<IndexTopicMessage>(&message)
            .expect(&format!("invalid message: {}", message));

        if let Ok(item) = get_video(&msg.video_id).await {
            let doc = Document::builder()
                .id(format!("{}.{}", &msg.video_id, &msg.lang))
                .title(&item.title)
                .attributes(DocumentAttribute::builder()
                    .key("_language_code")
                    .value(DocumentAttributeValue::builder().string_value(&msg.lang).build())
                    .build())
                .attributes(DocumentAttribute::builder()
                    .key("video_id")
                    .value(DocumentAttributeValue::builder().string_value(&msg.video_id).build())
                    .build())
                .attributes(DocumentAttribute::builder()
                    .key("video_key")
                    .value(DocumentAttributeValue::builder().string_value(&item.video_key).build())
                    .build())
                .attributes(DocumentAttribute::builder()
                    .key("thumbnail_key")
                    .value(DocumentAttributeValue::builder().string_value(&item.thumbnail_key.unwrap_or("".to_string())).build())
                    .build())
                .blob(Blob::new(msg.body.as_bytes()))
                .build();

            kendra.batch_put_document()
                .index_id(&kendra_index)
                .documents(doc)
                .send()
                .await
                .unwrap();
        }

    }

    Ok(())
}