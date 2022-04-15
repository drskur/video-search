use aws_lambda_events::event::s3::S3Event;
use aws_sdk_kendra::model::{AttributeFilter, ContentType, Document, DocumentAttribute, DocumentAttributeValue, UserContext};
use aws_sdk_kendra::Region;
use aws_sdk_kendra::types::Blob;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use serde_json::Value;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, BufReader};

#[tokio::main]
async fn main() -> Result<(), Error> {
    // let func = service_fn(handler);
    // lambda_runtime::run(func).await?;

    handler().await?;

    Ok(())
}

// async fn handler() -> Result<(), Error> {
//     let region = dotenv::var("KENDRA_REGION")?;
//     let shared_config = aws_config::from_env()
//         .region(Region::new(region))
//         .load().await;
//     let client = aws_sdk_kendra::Client::new(&shared_config);
//
//     let index_id = dotenv::var("VIDEO_INDEX_ID")
//         .expect("VIDEO_INDEX_ID must be set");
//     let ko_filter = AttributeFilter::builder()
//         .equals_to(DocumentAttribute::builder()
//             .key("_language_code")
//             .value(DocumentAttributeValue::builder()
//                 .string_value("ko")
//                 .build())
//             .build())
//         .build();
//
//     let output = client.query()
//         .index_id(index_id)
//         .query_text("가용영역은 무엇인가요?")
//         .attribute_filter(ko_filter)
//         .send()
//         .await?;
//
//     // let output = client.get_query_suggestions()
//     //     .index_id(index_id)
//     //     .query_text("아마존")
//     //     .send()
//     //     .await?;
//
//
//     println!("{:?}", output.total_number_of_results);
//     println!("{:?}", output.result_items);
//
//     Ok(())
// }

async fn handler() -> Result<(), Error> {
    let region = dotenv::var("KENDRA_REGION")?;
    let shared_config = aws_config::from_env()
        .region(Region::new(region))
        .load().await;
    let client = aws_sdk_kendra::Client::new(&shared_config);
    let index_id = dotenv::var("VIDEO_INDEX_ID")?;

    let file = File::open("ko.a.vtt").await?;
    let mut r = BufReader::new(file);
    let mut dat: Vec<u8> = vec![];
    r.read_to_end(&mut dat).await?;
    let blob = Blob::new(dat);

    let doc = Document::builder()
        .title("세 가지 맛있는 일요일 로스트 레시피 | 고든 램지")
        .id("ramsay2.ko")
        .attributes(
            DocumentAttribute::builder()
                .key("_language_code")
                .value(DocumentAttributeValue::builder()
                    .string_value("ko")
                    .build())
                .build()
        )
        .content_type(ContentType::PlainText)
        .blob(blob)
        .build();

    let output = client.batch_put_document()
        .index_id(&index_id)
        .documents(doc)
        .send()
        .await?;

    let file = File::open("a.vtt").await?;
    let mut r = BufReader::new(file);
    let mut dat: Vec<u8> = vec![];
    r.read_to_end(&mut dat).await?;
    let blob = Blob::new(dat);

    let doc = Document::builder()
        .title("Three Delicious Sunday Roast Recipes | Gordon Ramsay")
        .id("ramsay2.en")
        .attributes(
            DocumentAttribute::builder()
                .key("_language_code")
                .value(DocumentAttributeValue::builder()
                    .string_value("en")
                    .build())
                .build())
        .content_type(ContentType::PlainText)
        .blob(blob)
        .build();

    let output = client.batch_put_document()
        .index_id(&index_id)
        .documents(doc)
        .send()
        .await?;

    println!("Hello, World");
    println!("{:?}", output);
    Ok(())
}