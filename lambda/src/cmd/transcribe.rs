use std::path::{Path};
use aws_lambda_events::event::s3::S3Event;
use aws_sdk_dynamodb::model::AttributeValue;
use aws_sdk_transcribe::model::{LanguageCode, Media};
use chrono::Utc;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

async fn handler(event: LambdaEvent<S3Event>) -> Result<(), Error> {

    println!("{:?}", serde_json::to_string(&event.payload).unwrap());

    let table_name = dotenv::var("DYNAMODB_TABLE_NAME")
        .expect("DYNAMODB_TABLE_NAME must be set.");

    let shared_config = aws_config::from_env()
        .load().await;

    let dynamodb = aws_sdk_dynamodb::Client::new(&shared_config);
    let transcribe = aws_sdk_transcribe::Client::new(&shared_config);

    for record in event.payload.records {
        let bucket = record.s3.bucket.name.expect("object bucket must be exist.");
        let key = record.s3.object.key.expect("object key must be exist.");
        let decoded = url_escape::decode(&key).to_string();
        let key_path = Path::new(&decoded);
        let ext = key_path.extension().and_then(|s| s.to_str())
            .expect("file extension must be exist")
            .to_lowercase();

        if &ext != "mp4" && &ext != "mov" {
            println!("{} is unsupported format. skip {}", ext, key);
            continue;
        }

        let file_name = key_path.file_stem().and_then(|s| s.to_str()).expect("file name must be exist");
        if let [title, lang, ..] = file_name.split(".").collect::<Vec<&str>>()[..] {
            let id = Uuid::new_v4().to_string();
            dynamodb.put_item()
                .table_name(&table_name)
                .item("id", AttributeValue::S(id.clone()))
                .item("created_at", AttributeValue::S(Utc::now().to_string()))
                .item("video_key", AttributeValue::S(url_decode(&key)))
                .item("title", AttributeValue::S(url_decode(title)))
                .item("lang", AttributeValue::S(lang.to_string()))
                .send()
                .await
                .unwrap();

            let media_uri = url_decode(&format!("s3://{}/{}", &bucket, key));
            println!("Create Start Transcribe Job at {}", media_uri);
            let media = Media::builder()
                .media_file_uri(&media_uri)
                .build();

            transcribe.start_transcription_job()
                .language_code(LanguageCode::from(lang))
                .transcription_job_name(&id)
                .media(media)
                .output_bucket_name(&bucket)
                .output_key(format!("transcription/{}", &id))
                .send()
                .await
                .unwrap();
        }

    }

    Ok(())
}

fn url_decode(url: &str) -> String {
    url_escape::decode(url).replace("+", " ")
}

#[cfg(test)]
mod tests {
    use crate::url_decode;

    #[test]
    fn decode_test() {
        let input = "Jamie's+Quick+&+Easy+Egg+Fried+Rice+_+Jamie+Oliver";
        let expected_output = "Jamie's Quick & Easy Egg Fried Rice _ Jamie Oliver";
        let output = url_decode(input);

        assert_eq!(output.as_str(), expected_output);
    }

    #[test]
    fn decode_test2() {
        let input = "s3://video-search-drskur/video/Jamie%27s+Quick+%26+Easy+Egg+Fried+Rice+_+Jamie+Oliver.en-GB.mp4";
        let expected = "s3://video-search-drskur/video/Jamie's Quick & Easy Egg Fried Rice _ Jamie Oliver.en-GB.mp4";
        let output = url_decode(input);

        assert_eq!(output.as_str(), expected);
    }
}
