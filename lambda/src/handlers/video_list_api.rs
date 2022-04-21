use actix_web::HttpResponse;
use actix_web::get;
use serde::{Serialize, Deserialize};
use serde_dynamo::from_items;

#[derive(Serialize, Deserialize)]
struct VideoListItem {
    id: String,
    title: String,
    subtitles: Vec<String>,
    thumbnail_key: Option<String>,
}

#[get("/api/videos")]
pub async fn handler() -> actix_web::Result<HttpResponse> {

    let table_name = dotenv::var("DYNAMODB_TABLE_NAME")
        .expect("DYNAMODB_TABLE_NAME must be set.");

    let shared_config = aws_config::from_env().load().await;
    let dynamodb = aws_sdk_dynamodb::Client::new(&shared_config);

    let output = dynamodb.scan()
        .table_name(table_name)
        .projection_expression("id, title, thumbnail_key, subtitles")
        .send()
        .await
        .unwrap();

    let items: Vec<VideoListItem> = from_items(output.items.unwrap()).unwrap();

    let response = HttpResponse::Ok()
        .json(items);

    Ok(response)
}